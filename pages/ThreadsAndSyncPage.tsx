import React, { useState, useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import type { SyncSimulationMode, SyncThread, ThreadState, SyncMetrics, LogEntry } from '../types';
import Card from '../components/Card';
import SimulationHistoryModal from '../components/SimulationHistoryModal';
import { Play, Pause, RotateCcw, SkipForward, ChevronDown, ChevronUp, Lock, Users, Coffee, Scissors, BookOpen, Key, GitCommit, GitMerge, AlertTriangle, Activity, Gauge, TrendingUp, Zap, CheckCircle, Download, History, FileDown } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import { useSimulationHistory, SimulationHistoryEntry } from '../hooks/useSimulationHistory';
import { exportAsJSON } from '../utils/exportUtils';

// --- CONSTANTS & CONFIGS ---
const THREAD_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#6366f1', '#f59e0b'];
const SIMULATION_MODES: { id: SyncSimulationMode; name: string; icon: React.ElementType }[] = [
  { id: 'MUTEX', name: 'Mutex Locks', icon: Lock },
  { id: 'SEMAPHORE', name: 'Semaphores', icon: Key },
  { id: 'READERS_WRITERS', name: 'Readers-Writers', icon: BookOpen },
  { id: 'DINING_PHILOSOPHERS', name: 'Dining Philosophers', icon: Coffee },
];

const INITIAL_CONFIGS: Record<SyncSimulationMode, any> = {
  MUTEX: { threadCount: 5, csDuration: 20, contentionRate: 0.5 },
  SEMAPHORE: { producers: 2, consumers: 2, bufferSize: 3, produceTime: 15, consumeTime: 20 },
  READERS_WRITERS: { readers: 4, writers: 2, readTime: 10, writeTime: 25, requestRate: 0.1 },
  DINING_PHILOSOPHERS: { count: 5, thinkTime: 30, eatTime: 20, preventDeadlock: false },
  // These are not implemented per the prompt, so their configs are empty.
  SLEEPING_BARBER: {}, CONDITION_VARIABLE: {}, BARRIER: {},
};

const STATE_COLORS: Record<ThreadState, string> = {
  IDLE: 'bg-gray-400', WAITING: 'bg-yellow-500 animate-pulse', ACTIVE: 'bg-green-500',
  BLOCKED: 'bg-red-500', FINISHED: 'bg-gray-700', THINKING: 'bg-blue-500',
  HUNGRY: 'bg-orange-500', EATING: 'bg-purple-500', GETTING_HAIRCUT: 'bg-pink-500',
  IN_WAITING_ROOM: 'bg-indigo-500',
};

// --- STATE MANAGEMENT (REDUCER) ---
interface SimState {
  mode: SyncSimulationMode;
  config: any;
  threads: SyncThread[];
  resources: any;
  metrics: SyncMetrics;
  log: LogEntry[];
  time: number;
  isRunning: boolean;
  speed: number;
}

type Action =
  | { type: 'SET_MODE'; payload: SyncSimulationMode }
  | { type: 'START' } | { type: 'PAUSE' } | { type: 'STEP' }
  | { type: 'RESET' } | { type: 'TICK' }
  | { type: 'UPDATE_CONFIG'; payload: { key: string; value: any } }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'RESOLVE_DEADLOCK' };

const createInitialState = (mode: SyncSimulationMode): SimState => {
  const config = INITIAL_CONFIGS[mode];
  let threads: SyncThread[] = [];
  let resources: any = {};

  switch (mode) {
    case 'MUTEX':
      threads = Array.from({ length: config.threadCount }, (_, i) => ({
        id: i, name: `T${i}`, state: 'IDLE', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
        message: 'Idle', actionTimer: 0,
      }));
      resources = { mutexLocked: false, owner: null, queue: [] };
      break;
    case 'SEMAPHORE':
        const total = config.producers + config.consumers;
        threads = Array.from({ length: total }, (_, i) => ({
            id: i, name: i < config.producers ? `Prod ${i}` : `Cons ${i-config.producers}`,
            state: 'IDLE', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
            message: 'Idle', actionTimer: 0,
        }));
        resources = { buffer: [], mutex: 1, empty: config.bufferSize, full: 0 };
        break;
    case 'READERS_WRITERS':
        const rw_total = config.readers + config.writers;
        threads = Array.from({ length: rw_total }, (_, i) => ({
            id: i, name: i < config.readers ? `Reader ${i}` : `Writer ${i-config.readers}`,
            state: 'IDLE', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
            message: 'Idle', actionTimer: 0,
        }));
        resources = { readers: 0, writerActive: false, queue: [] };
        break;
    case 'DINING_PHILOSOPHERS':
      threads = Array.from({ length: config.count }, (_, i) => ({
        id: i, name: `P${i}`, state: 'THINKING', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
        message: 'Thinking...', actionTimer: Math.random() * config.thinkTime,
        leftFork: i, rightFork: (i + 1) % config.count,
      }));
      resources = { forks: Array(config.count).fill(null) };
      break;
  }
  return {
    mode, config, threads, resources,
    metrics: { avgWaitTime: 0, throughput: 0, lockContention: 0, deadlocks: 0, itemsProduced: 0, itemsConsumed: 0, customersServed: 0, customersTurnedAway: 0, totalAcquisitions: 0, totalWaits: 0},
    log: [{id: Date.now(), message: `Initialized ${SIMULATION_MODES.find(m=>m.id===mode)!.name} simulation.`, type: 'info', timestamp: new Date().toLocaleTimeString()}],
    time: 0, isRunning: false, speed: 500,
  };
};

const reducer = (state: SimState, action: Action): SimState => {
  switch (action.type) {
    case 'SET_MODE': return createInitialState(action.payload);
    case 'START': return { ...state, isRunning: true };
    case 'PAUSE': return { ...state, isRunning: false };
    case 'STEP': {
        const nextState = reducer({ ...state, isRunning: true }, { type: 'TICK' });
        return { ...nextState, isRunning: false };
    }
    case 'RESET': return createInitialState(state.mode);
    case 'UPDATE_CONFIG':
        const newConfig = { ...state.config, [action.payload.key]: action.payload.value };
        const newStateOnConfig = createInitialState(state.mode);
        return { ...newStateOnConfig, config: newConfig };
    case 'SET_SPEED': return { ...state, speed: 1000 - action.payload };
    case 'RESOLVE_DEADLOCK': {
      if (state.mode !== 'DINING_PHILOSOPHERS') return state;
      const newState = JSON.parse(JSON.stringify(state));
      newState.threads.forEach((p: SyncThread) => {
        p.state = 'THINKING';
        p.message = 'Thinking... (Deadlock resolved)';
        p.actionTimer = Math.random() * newState.config.thinkTime;
      });
      newState.resources.forks.fill(null);
      newState.metrics.deadlocks = 0;
      newState.log.unshift({id: Date.now(), message: 'Deadlock resolved by forcing philosophers to release forks.', type: 'success', timestamp: new Date().toLocaleTimeString()});
      return newState;
    }
    case 'TICK': {
      if (!state.isRunning) return state;
      let newState = JSON.parse(JSON.stringify(state));
      newState.time++;
      const addLog = (message: string, type: LogEntry['type']) => {
        newState.log.unshift({id: Date.now() + Math.random(), message, type, timestamp: new Date().toLocaleTimeString()});
        if(newState.log.length > 200) newState.log.pop();
      };

      switch (state.mode) {
        case 'MUTEX': {
          newState.threads.forEach((t: SyncThread) => {
            if (t.state === 'IDLE' && Math.random() < newState.config.contentionRate / 20) {
              t.state = 'WAITING';
              t.message = 'Wants lock';
              newState.resources.queue.push(t.id);
              addLog(`T${t.id} wants to enter CS.`, 'info');
              newState.metrics.totalWaits++;
            } else if (t.state === 'ACTIVE') {
              t.actionTimer--;
              t.progress = (newState.config.csDuration - t.actionTimer) / newState.config.csDuration * 100;
              if (t.actionTimer <= 0) {
                t.state = 'IDLE';
                t.message = 'Exited CS';
                newState.resources.mutexLocked = false;
                newState.resources.owner = null;
                addLog(`T${t.id} released lock.`, 'success');
              }
            }
          });
          if (!newState.resources.mutexLocked && newState.resources.queue.length > 0) {
            const nextThreadId = newState.resources.queue.shift();
            const nextThread = newState.threads.find((t:SyncThread) => t.id === nextThreadId);
            if (nextThread) {
              newState.resources.mutexLocked = true;
              newState.resources.owner = nextThread.id;
              nextThread.state = 'ACTIVE';
              nextThread.message = 'In CS';
              nextThread.actionTimer = newState.config.csDuration;
              nextThread.progress = 0;
              addLog(`T${nextThread.id} acquired lock.`, 'action');
              newState.metrics.totalAcquisitions++;
            }
          }
          break;
        }
        case 'SEMAPHORE': {
            const { producers, bufferSize, produceTime, consumeTime } = newState.config;
            newState.threads.forEach((t: SyncThread, i: number) => {
                const isProducer = i < producers;
                if (t.state === 'IDLE') {
                    if (isProducer && newState.resources.empty > 0 && newState.resources.mutex > 0) {
                        newState.resources.empty--;
                        newState.resources.mutex--;
                        t.state = 'ACTIVE';
                        t.message = 'Producing';
                        t.actionTimer = produceTime;
                        t.progress = 0;
                    } else if (!isProducer && newState.resources.full > 0 && newState.resources.mutex > 0) {
                        newState.resources.full--;
                        newState.resources.mutex--;
                        t.state = 'ACTIVE';
                        t.message = 'Consuming';
                        t.actionTimer = consumeTime;
                        t.progress = 0;
                    }
                } else if (t.state === 'ACTIVE') {
                    t.actionTimer--;
                    const duration = isProducer ? produceTime : consumeTime;
                    t.progress = (duration - t.actionTimer) / duration * 100;
                    if (t.actionTimer <= 0) {
                        if (isProducer) {
                            newState.resources.buffer.push(`Item`);
                            newState.metrics.itemsProduced++;
                            addLog(`${t.name} produced an item.`, 'success');
                            newState.resources.full++;
                        } else {
                            newState.resources.buffer.shift();
                            newState.metrics.itemsConsumed++;
                            addLog(`${t.name} consumed an item.`, 'action');
                            newState.resources.empty++;
                        }
                        newState.resources.mutex++;
                        t.state = 'IDLE';
                        t.message = 'Finished';
                        t.progress = 0;
                    }
                }
            });
            break;
        }
        case 'READERS_WRITERS': {
            const { readers, readTime, writeTime, requestRate } = newState.config;
            newState.threads.forEach((t: SyncThread, i: number) => {
                const isReader = i < readers;
                if(t.state === 'IDLE' && Math.random() < requestRate) {
                    t.state = 'WAITING';
                    t.message = `Wants to ${isReader ? 'read' : 'write'}`;
                    newState.resources.queue.push({id: t.id, type: isReader ? 'R' : 'W'});
                    addLog(`${t.name} wants to ${isReader ? 'read' : 'write'}.`, 'info');
                } else if (t.state === 'ACTIVE') {
                    t.actionTimer--;
                    if(t.actionTimer <= 0) {
                        if (isReader) {
                            newState.resources.readers--;
                            addLog(`${t.name} finished reading.`, 'info');
                        } else {
                            newState.resources.writerActive = false;
                            addLog(`${t.name} finished writing.`, 'success');
                        }
                        t.state = 'IDLE';
                        t.message = 'Finished';
                    }
                }
            });
            // Scheduler
            if (newState.resources.queue.length > 0) {
                const nextInQueue = newState.resources.queue[0];
                const isWriterNext = nextInQueue.type === 'W';

                if (!newState.resources.writerActive) {
                    if (isWriterNext) {
                        if (newState.resources.readers === 0) {
                             newState.resources.queue.shift();
                             const writerThread = newState.threads.find((th:SyncThread) => th.id === nextInQueue.id);
                             if(writerThread) {
                                writerThread.state = 'ACTIVE';
                                writerThread.message = 'Writing';
                                writerThread.actionTimer = writeTime;
                                newState.resources.writerActive = true;
                                addLog(`${writerThread.name} started writing.`, 'action');
                             }
                        }
                    } else { // Readers are next
                        const readersToStart = newState.resources.queue.filter((req:any) => req.type === 'R');
                        newState.resources.queue = newState.resources.queue.filter((req:any) => req.type !== 'R');
                        readersToStart.forEach((req:any) => {
                            const readerThread = newState.threads.find((th:SyncThread) => th.id === req.id);
                            if(readerThread) {
                                readerThread.state = 'ACTIVE';
                                readerThread.message = 'Reading';
                                readerThread.actionTimer = readTime;
                                newState.resources.readers++;
                            }
                        });
                        if (readersToStart.length > 0) addLog(`${readersToStart.length} reader(s) started reading.`, 'action');
                    }
                }
            }
            break;
        }
        case 'DINING_PHILOSOPHERS': {
            if (newState.metrics.deadlocks > 0) break; // Halt simulation on deadlock
            newState.threads.forEach((p: SyncThread) => {
                const philosopher = p as any;
                if (p.state === 'THINKING') {
                    p.actionTimer--;
                    if (p.actionTimer <= 0) {
                        p.state = 'HUNGRY';
                        p.message = "Hungry!";
                        addLog(`${p.name} is hungry.`, 'info');
                    }
                } else if (p.state === 'EATING') {
                    p.actionTimer--;
                    if (p.actionTimer <= 0) {
                        p.state = 'THINKING';
                        p.message = "Thinking...";
                        p.actionTimer = Math.random() * newState.config.thinkTime;
                        newState.resources.forks[philosopher.leftFork] = null;
                        newState.resources.forks[philosopher.rightFork] = null;
                        addLog(`${p.name} finished eating and released forks.`, 'success');
                    }
                } else if (p.state === 'HUNGRY') {
                    const leftFork = philosopher.leftFork;
                    const rightFork = philosopher.rightFork;
                    
                    if (newState.config.preventDeadlock) {
                        const firstFork = Math.min(leftFork, rightFork);
                        const secondFork = Math.max(leftFork, rightFork);
                        if (newState.resources.forks[firstFork] === null) {
                            newState.resources.forks[firstFork] = p.id;
                             if (newState.resources.forks[secondFork] === null) {
                                newState.resources.forks[secondFork] = p.id;
                                p.state = 'EATING';
                                p.message = "Eating!";
                                p.actionTimer = newState.config.eatTime;
                                addLog(`${p.name} picked up both forks and is eating.`, 'action');
                             }
                        }
                    } else {
                        if (newState.resources.forks[leftFork] === null) {
                            newState.resources.forks[leftFork] = p.id;
                            p.message = "Has left fork";
                            if (newState.resources.forks[rightFork] === null) {
                                newState.resources.forks[rightFork] = p.id;
                                p.state = 'EATING';
                                p.message = "Eating!";
                                p.actionTimer = newState.config.eatTime;
                                addLog(`${p.name} picked up both forks and is eating.`, 'action');
                            }
                        }
                    }
                }
            });
             const isDeadlock = newState.threads.every((p:SyncThread) => p.state === 'HUNGRY' && p.message.includes("Has left fork"));
             if (isDeadlock && newState.metrics.deadlocks === 0) {
                addLog('DEADLOCK DETECTED! Each philosopher has one fork.', 'error');
                newState.metrics.deadlocks = 1;
             }
            break;
        }
      }
      return newState;
    }
    default: return state;
  }
};

const ThreadsAndSyncPage: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, 'MUTEX', createInitialState);
  const timerRef = useRef<number | null>(null);
  const [isEduOpen, setIsEduOpen] = useState(true);

  // Export and History state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { addToHistory } = useSimulationHistory();

  const startSimulation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, state.speed);
  }, [state.speed]);

  useEffect(() => {
    if (state.isRunning) {
      startSimulation();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.isRunning, startSimulation]);
  
  const handleUpdateConfig = (key: string, value: any) => {
    dispatch({type: 'UPDATE_CONFIG', payload: {key, value}});
  }

  const handleSaveState = () => {
    const stateData = {
      timestamp: new Date().toISOString(),
      mode: state.mode,
      config: state.config,
      threads: state.threads,
      metrics: state.metrics
    };

    addToHistory({
      simulationType: 'threads-sync',
      algorithm: state.mode,
      processes: state.threads.map(t => ({
        id: t.id,
        name: t.name,
        arrivalTime: 0,
        burstTime: 0,
        priority: 0
      })),
      result: {
        ganttChart: [],
        processMetrics: state.threads.map(t => ({
          id: t.id,
          name: t.name,
          arrivalTime: 0,
          burstTime: 0,
          completionTime: 0,
          turnaroundTime: 0,
          waitingTime: 0,
          priority: 0
        })),
        metrics: {
          averageWaitingTime: state.metrics.totalWaitTime / state.threads.length,
          averageTurnaroundTime: 0,
          cpuUtilization: 100
        },
        totalDuration: state.ticks
      },
      name: `${state.mode} - ${state.threads.length} threads`
    });
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `threads-sync-${state.mode.toLowerCase()}-${timestamp}`;

    const exportData = {
      timestamp: new Date().toISOString(),
      mode: state.mode,
      config: state.config,
      threads: state.threads,
      metrics: state.metrics,
      ticks: state.ticks,
      log: state.log
    };

    exportAsJSON(exportData, filename);
  };

  const handleReplay = (entry: SimulationHistoryEntry) => {
    setIsHistoryModalOpen(false);
  };

  const educationalContent = useMemo(() => {
    switch (state.mode) {
      case 'MUTEX': return { title: "Mutex (Mutual Exclusion)", content: "A mutex is a lock that ensures only one thread can access a shared resource (the 'critical section') at a time, preventing race conditions. Other threads wanting the lock must wait until it's released." };
      case 'SEMAPHORE': return { title: "Semaphores (Producer-Consumer)", content: "A semaphore is a counter that controls access to a resource with multiple instances. Here, we use a binary semaphore (mutex) for buffer access, and two counting semaphores to track empty/full buffer slots." };
      case 'READERS_WRITERS': return { title: "Readers-Writers Problem", content: "A synchronization problem where multiple 'reader' threads can access a resource simultaneously, but a 'writer' thread requires exclusive access. This visualization shows a reader-preference solution." };
      case 'DINING_PHILOSOPHERS': return { title: "Dining Philosophers", content: "A classic problem illustrating deadlock. Five philosophers need two forks to eat, but only five forks are available. If each picks up their left fork simultaneously, no one can pick up their right fork, and they starve." };
      default: return { title: "", content: "" };
    }
  }, [state.mode]);

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">Threads & Synchronization</h1>

      {/* Educational Overview */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-blue-500/5 border-teal-200 dark:border-teal-800">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="text-teal-500" size={24} />
          What is Thread Synchronization?
        </h2>
        <p className="text-sm sm:text-base leading-relaxed mb-4">
          Thread synchronization is a mechanism that ensures <strong>coordinated access</strong> to shared resources among multiple threads.
          Without proper synchronization, threads can interfere with each other, causing <strong>race conditions</strong> and data inconsistencies.
          Common synchronization primitives include <strong className="text-teal-600 dark:text-teal-400">mutexes</strong> (mutual exclusion locks), 
          <strong className="text-cyan-600 dark:text-cyan-400"> semaphores</strong> (counters for resource availability), and 
          <strong className="text-blue-600 dark:text-blue-400"> monitors</strong>. These tools help prevent deadlocks, starvation, and ensure thread safety.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-teal-600 dark:text-teal-400 mb-1">Mutex</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Exclusive access</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Semaphore</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Resource counter</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Readers-Writers</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Concurrent reads</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Philosophers</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Deadlock demo</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="text-teal-500" size={20} />
                Simulation Mode
              </h2>
              <div className="space-y-2">
                {SIMULATION_MODES.map(m => (
                    <button key={m.id} onClick={() => dispatch({type: 'SET_MODE', payload: m.id})}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                          state.mode === m.id 
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md scale-105' 
                            : 'bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        <m.icon size={18} /> {m.name}
                    </button>
                ))}
              </div>
          </Card>
          <ConfigPanel mode={state.mode} config={state.config} onUpdate={handleUpdateConfig} />
        </div>

        {/* Center Panel */}
        <div className="lg:col-span-6">
          <Card className="p-4 sm:p-5 h-[600px] relative bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border-teal-200 dark:border-teal-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 animate-pulse"></div>
              <h2 className="text-lg font-semibold">Live Visualization</h2>
            </div>
            <VisualizationPanel state={state} />
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4 sm:p-5">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="text-cyan-500" size={20} />
              Controls
            </h2>
            
            {/* Playback Controls */}
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border border-teal-300 dark:border-teal-700">
              <h3 className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2 flex items-center gap-1">
                <Play size={14} />
                Playback
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => dispatch({type: state.isRunning ? 'PAUSE' : 'START'})} 
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 text-sm ${
                    state.isRunning 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700' 
                      : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700'
                  }`}
                >
                  {state.isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Start</>}
                </button>
                <button 
                  onClick={() => dispatch({type: 'STEP'})} 
                  disabled={state.isRunning} 
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                >
                  <SkipForward size={16}/> Step
                </button>
              </div>
            </div>

            {/* Reset Control */}
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-gray-500/5 to-gray-600/5 border border-gray-300 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <RotateCcw size={14} />
                Reset
              </h3>
              <button 
                onClick={() => dispatch({type: 'RESET'})} 
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 text-sm"
              >
                <RotateCcw size={16}/> Reset Simulation
              </button>
            </div>

            {/* Speed Control */}
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-300 dark:border-blue-700">
              <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                <Gauge size={14} />
                Simulation Speed
              </h3>
              <input 
                type="range" 
                min="50" 
                max="950" 
                value={1000 - state.speed} 
                onChange={e => dispatch({type: 'SET_SPEED', payload: Number(e.target.value)})} 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-teal-500"
              />
              <div className="flex justify-between text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Deadlock Resolution (Conditional) */}
            {state.mode === 'DINING_PHILOSOPHERS' && state.metrics.deadlocks > 0 && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500 animate-pulse">
                <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Deadlock Detected!
                </h3>
                <button 
                  onClick={() => dispatch({ type: 'RESOLVE_DEADLOCK' })} 
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                >
                  <AlertTriangle size={16}/> Resolve Deadlock
                </button>
              </div>
            )}

            {/* Export & History */}
            {state.threads.length > 0 && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-600/5 border border-green-300 dark:border-green-700">
                <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                  <Download size={14} />
                  Export & History
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setIsHistoryModalOpen(true)} className="w-full flex items-center justify-center gap-1 px-2 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg text-xs">
                    <History size={14} />
                    <span>History</span>
                  </button>
                  <button onClick={handleExport} className="w-full flex items-center justify-center gap-1 px-2 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg text-xs">
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                  <button onClick={handleSaveState} className="w-full flex items-center justify-center gap-1 px-2 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-md hover:shadow-lg text-xs">
                    <FileDown size={14} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
          <MetricsPanel state={state}/>
          <LogPanel log={state.log}/>
        </div>
      </div>
       <Card className="p-4 sm:p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-200 dark:border-cyan-800">
          <button onClick={() => setIsEduOpen(!isEduOpen)} className="w-full flex justify-between items-center text-left">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <CheckCircle className="text-cyan-500" size={24} />
                {educationalContent.title}
              </h2>
              {isEduOpen ? <ChevronUp className="text-cyan-500"/> : <ChevronDown className="text-cyan-500"/>}
          </button>
          {isEduOpen && (
            <div className="mt-4 space-y-3">
              <p className="text-sm sm:text-base text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                {educationalContent.content}
              </p>
              {state.mode === 'DINING_PHILOSOPHERS' && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-300 dark:border-red-700">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Deadlock Prevention
                  </h3>
                  <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                    Enable "Prevent Deadlock" to use <strong>resource ordering</strong> - philosophers always pick up the 
                    lower-numbered fork first. This breaks the circular wait condition and prevents deadlock.
                  </p>
                </div>
              )}
            </div>
          )}
       </Card>

      {/* Simulation History Modal */}
      <SimulationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onReplay={handleReplay}
        simulationType="threads-sync"
      />

      <style>{`
        .btn-primary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-700 transition-all duration-300; }
        .btn-secondary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300; }
        .btn-danger { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-red-700 hover:to-orange-700 transition-all duration-300 animate-pulse; }
      `}</style>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const ConfigPanel: React.FC<{mode: SyncSimulationMode, config: any, onUpdate: (k:string,v:any)=>void}> = ({mode, config, onUpdate}) => {
    const content = () => {
        switch(mode) {
            case 'MUTEX': return <>
                <ConfigInput label="Threads" value={config.threadCount} onChange={v => onUpdate('threadCount',v)} min={1} max={8}/>
                <ConfigInput label="CS Duration (ticks)" value={config.csDuration} onChange={v => onUpdate('csDuration',v)} min={1}/>
                <ConfigInput label="Contention Rate" value={config.contentionRate} onChange={v => onUpdate('contentionRate',v)} min={0.1} max={1} step={0.1}/>
            </>;
            case 'SEMAPHORE': return <>
                <ConfigInput label="Producers" value={config.producers} onChange={v => onUpdate('producers',v)} min={1} max={4}/>
                <ConfigInput label="Consumers" value={config.consumers} onChange={v => onUpdate('consumers',v)} min={1} max={4}/>
                <ConfigInput label="Buffer Size" value={config.bufferSize} onChange={v => onUpdate('bufferSize',v)} min={1} max={8}/>
            </>;
            case 'READERS_WRITERS': return <>
                <ConfigInput label="Readers" value={config.readers} onChange={v => onUpdate('readers',v)} min={1} max={6}/>
                <ConfigInput label="Writers" value={config.writers} onChange={v => onUpdate('writers',v)} min={1} max={3}/>
                <ConfigInput label="Request Rate" value={config.requestRate} onChange={v => onUpdate('requestRate',v)} min={0.01} max={0.5} step={0.01}/>
            </>;
            case 'DINING_PHILOSOPHERS': return <>
                <ConfigInput label="Philosophers" value={config.count} onChange={v => onUpdate('count',v)} min={3} max={8}/>
                 <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Prevent Deadlock</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.preventDeadlock} onChange={e => onUpdate('preventDeadlock', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-cyan-600"></div>
                    </label>
                </div>
            </>;
            default: return <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No configuration for this mode.</p>;
        }
    }
    return <Card className="p-4 sm:p-5">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
        <Gauge className="text-blue-500" size={20} />
        Configuration
      </h2>
      <div className="space-y-3">{content()}</div>
    </Card>;
}

const ConfigInput: React.FC<{label:string, value:number, onChange:(v:number)=>void, min?:number, max?:number, step?:number}> = ({label, value, onChange, ...props}) => (
    <div>
        <label className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} {...props} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300" />
    </div>
);

const MetricsPanel: React.FC<{state:SimState}> = ({state}) => {
    const { metrics, time, mode } = state;
    return (
    <Card className="p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-teal-500" size={20} />
          Metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center">
            <MetricBox label="Time" value={time} unit=" ticks" color="teal"/>
            {mode === 'MUTEX' && <>
                <MetricBox label="Acquisitions" value={metrics.totalAcquisitions} color="cyan"/>
                <MetricBox label="Total Waits" value={metrics.totalWaits} color="blue"/>
            </>}
            {mode === 'SEMAPHORE' && <>
                <MetricBox label="Items Produced" value={metrics.itemsProduced} color="green"/>
                <MetricBox label="Items Consumed" value={metrics.itemsConsumed} color="blue"/>
            </>}
            {mode === 'DINING_PHILOSOPHERS' && metrics.deadlocks > 0 && 
                <div className="p-3 col-span-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 animate-pulse">
                    <AlertTriangle size={18}/> DEADLOCKED
                </div>
            }
        </div>
    </Card>
)};

const MetricBox: React.FC<{label:string, value:number, unit?:string, color:string}> = ({label, value, unit, color}) => {
    const gradientMap: Record<string, string> = {
        teal: 'from-teal-500/20 to-cyan-500/20 border-teal-400 dark:border-teal-600 text-teal-700 dark:text-teal-300',
        cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-400 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300',
        blue: 'from-blue-500/20 to-indigo-500/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300',
        green: 'from-green-500/20 to-emerald-500/20 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300',
    };
    
    return (
        <div className={`p-3 bg-gradient-to-br ${gradientMap[color]} border rounded-lg transition-all duration-300 hover:scale-105`}>
            <p className="text-xs font-medium mb-1">{label}</p>
            <div className="text-lg sm:text-xl font-bold">
                <AnimatedNumber value={value} precision={0}/>
                {unit && <span className="text-sm font-medium">{unit}</span>}
            </div>
        </div>
    );
};

const LogPanel: React.FC<{log: LogEntry[]}> = ({log}) => (
    <Card className="p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2">
          <Activity className="text-blue-500" size={20} />
          Event Log
        </h2>
        <div className="h-48 overflow-y-auto space-y-1.5 text-xs font-mono">
            {log.map(entry => {
                const bgColor = entry.type === 'error' 
                    ? 'bg-red-500/10 border-l-2 border-red-500' 
                    : entry.type === 'success'
                    ? 'bg-green-500/10 border-l-2 border-green-500'
                    : entry.type === 'action'
                    ? 'bg-blue-500/10 border-l-2 border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-800';
                    
                return (
                    <div key={entry.id} className={`flex items-start gap-2 p-2 rounded ${bgColor}`}>
                        <p className="text-text-muted-light dark:text-text-muted-dark flex-shrink-0 text-[10px]">{entry.timestamp}</p>
                        <p className="flex-grow break-words text-[11px]">{entry.message}</p>
                    </div>
                );
            })}
        </div>
    </Card>
);

const VisualizationPanel: React.FC<{state: SimState}> = ({state}) => {
    const { mode, threads, resources, config, metrics } = state;
    
    const ThreadComponent: React.FC<{t:SyncThread, x:number, y:number, isDeadlocked?: boolean}> = ({t, x, y, isDeadlocked = false}) => (
        <g transform={`translate(${x}, ${y})`} className="group transition-transform duration-500 ease-in-out cursor-pointer hover:scale-110">
            <circle cx="0" cy="0" r="22" fill={t.color} stroke={isDeadlocked ? '#ef4444' : '#fff'} strokeWidth={isDeadlocked ? 4 : 2} className={isDeadlocked ? 'animate-pulse' : ''} opacity="0.9" />
            <circle cx="0" cy="0" r="26" fill="none" stroke={t.color} strokeWidth="1.5" opacity="0.3" className="group-hover:opacity-100 transition-opacity duration-300" />
            <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" style={{pointerEvents: 'none'}}>{t.name}</text>
            <title>{t.name}: {t.message}</title>
        </g>
    );

    switch(mode) {
        case 'MUTEX': return <svg width="100%" height="100%" viewBox="0 0 400 600">
            <rect x="150" y="250" width="100" height="100" fill="rgba(20, 184, 166, 0.1)" strokeDasharray="5" stroke="#14b8a6" strokeWidth="2" rx="10"/>
            <text x="200" y="240" textAnchor="middle" fontWeight="bold" fontSize="14" className="fill-current">Critical Section</text>
            {resources.owner !== null && (
                <g transform="translate(200, 300)">
                    <Lock x="-15" y="-15" size={30} className="text-teal-500" />
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#14b8a6" strokeWidth="2" className="animate-ping" opacity="0.5" />
                </g>
            )}
              {threads.map((t, idx) => {
                const total = threads.length || 1;
                const topMargin = 60;
                const bottomMargin = 60;
                const containerHeight = 600 - topMargin - bottomMargin;
                const slotHeight = containerHeight / total;
                let x = 75;
                let y = topMargin + (idx + 0.5) * slotHeight;

                if (t.state === 'ACTIVE') { x = 200; y = 300; }
                if (t.state === 'WAITING') {
                 x = 200;
                 const qIndex = resources.queue.indexOf(t.id);
                 if (qIndex >= 0) y = 120 + qIndex * 50;
                }

                return <ThreadComponent key={t.id} t={t} x={x} y={y} />
              })}
        </svg>;
        case 'SEMAPHORE': return <svg width="100%" height="100%" viewBox="0 0 400 600">
            <text x="200" y="30" textAnchor="middle" fontWeight="bold" fontSize="14" className="fill-current">Shared Buffer ({resources.buffer.length}/{config.bufferSize})</text>
            <rect x="25" y="45" width={config.bufferSize * 45 + 10} height="50" fill="rgba(20, 184, 166, 0.05)" stroke="#14b8a6" strokeWidth="1.5" rx="8" />
            {Array.from({length: config.bufferSize}).map((_, i) => (
                <g key={i}>
                    <rect x={30 + i * 45} y="50" width="40" height="40" stroke="#14b8a6" strokeWidth="2" fill={i < resources.buffer.length ? 'url(#bufferGradient)' : 'transparent'} rx="5"/>
                    {i < resources.buffer.length && (
                        <circle cx={50 + i * 45} cy="70" r="3" fill="#14b8a6" className="animate-pulse" />
                    )}
                </g>
            ))}
            <defs>
                <linearGradient id="bufferGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#14b8a6', stopOpacity: 0.7}} />
                    <stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 0.9}} />
                </linearGradient>
            </defs>
            <text x="30" y="120" fontSize="12" className="fill-current font-semibold">Producers</text>
            <text x="320" y="120" fontSize="12" className="fill-current font-semibold">Consumers</text>
            {threads.map((t, i) => {
              const isProducer = i < config.producers;
              const total = threads.length || 1;
              const topMargin = 80;
              const bottomMargin = 80;
              const containerHeight = 600 - topMargin - bottomMargin;
              const slotHeight = containerHeight / total;
              let x = isProducer ? 75 : 325;
              let y = topMargin + (i + 0.5) * slotHeight;
              return <ThreadComponent key={t.id} t={t} x={x} y={y} />
            })}
        </svg>;
        case 'READERS_WRITERS': return <svg width="100%" height="100%" viewBox="0 0 400 600">
            <rect x="100" y="200" width="200" height="200" fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5" rx="10"/>
            <text x="200" y="190" textAnchor="middle" fontWeight="bold" fontSize="14" className="fill-current">Shared Resource</text>
            <text x="200" y="415" textAnchor="middle" fontSize="12" className="fill-current font-semibold">
                <tspan fill="#14b8a6">Readers: {resources.readers}</tspan> 
                {resources.writerActive && <tspan fill="#ef4444"> | Writer Active</tspan>}
            </text>
            <text x="50" y="80" fontSize="12" className="fill-current font-semibold">Readers</text>
            <text x="320" y="80" fontSize="12" className="fill-current font-semibold">Writers</text>
             {threads.map((t, i) => {
              const isReader = i < config.readers;
              const total = threads.length || 1;
              const topMargin = 80;
              const bottomMargin = 80;
              const containerHeight = 600 - topMargin - bottomMargin;
              const slotHeight = containerHeight / total;
              let x = isReader ? 50 : 350;
              let y = topMargin + (i + 0.5) * slotHeight;
              if(t.state === 'ACTIVE') { x = 200; y = 250 + (i % 4) * 40; }
              if(t.state === 'WAITING') { x = isReader ? 120 : 280; const qIdx = resources.queue.findIndex((q:any) => q.id === t.id); if (qIdx >= 0) y = 100 + qIdx * 50; }
              return <ThreadComponent key={t.id} t={t} x={x} y={y} />
            })}
        </svg>;
        case 'DINING_PHILOSOPHERS': {
            const R = 150, CX=200, CY=300;
            return <svg width="100%" height="100%" viewBox="0 0 400 600">
                <circle cx={CX} cy={CY} r={R-40} fill="url(#tableGradient)" stroke="#14b8a6" strokeWidth="2"/>
                <defs>
                    <linearGradient id="tableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#f3f4f6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#e5e7eb', stopOpacity: 1}} />
                    </linearGradient>
                    <radialGradient id="forkGradient">
                        <stop offset="0%" style={{stopColor: '#fbbf24', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#f59e0b', stopOpacity: 0.8}} />
                    </radialGradient>
                </defs>
                <text x={CX} y="30" textAnchor="middle" fontWeight="bold" fontSize="14" className="fill-current">
                    Dining Philosophers {metrics.deadlocks > 0 && <tspan fill="#ef4444">(DEADLOCKED!)</tspan>}
                </text>
                {threads.map((p, i) => {
                    const angle = (i / config.count) * 2 * Math.PI - Math.PI / 2;
                    const x = CX + Math.cos(angle) * R;
                    const y = CY + Math.sin(angle) * R;
                    const isDeadlocked = metrics.deadlocks > 0 && p.state === 'HUNGRY';
                    return <ThreadComponent key={p.id} t={p} x={x} y={y} isDeadlocked={isDeadlocked} />
                })}
                 {Array.from({length: config.count}).map((_, i) => {
                    const angle = (i / config.count) * 2 * Math.PI - Math.PI / 2 + (Math.PI/config.count);
                    const ownerId = resources.forks[i];
                    const owner = threads.find(p => p.id === ownerId);
                    const isTaken = owner !== undefined;

                    return <g key={i} transform={`translate(${CX + Math.cos(angle)*(R-60)}, ${CY + Math.sin(angle)*(R-60)})`}>
                        <circle cx="0" cy="0" r="16" fill={isTaken ? 'url(#forkGradient)' : '#d1d5db'} stroke={isTaken ? '#f59e0b' : '#9ca3af'} strokeWidth="2" className={isTaken ? 'animate-pulse' : ''} />
                        <Key size={20} x="-10" y="-10" style={{color: isTaken ? '#78350f' : '#6b7280'}} />
                    </g>;
                })}
            </svg>;
        }
        default: return <p>Visualization not available for this mode.</p>;
    }
}

export default ThreadsAndSyncPage;

