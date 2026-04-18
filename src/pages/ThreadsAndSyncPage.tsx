import React, { useState, useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import type { SyncSimulationMode, SyncThread, ThreadState, SyncMetrics, LogEntry } from '@/types';
import Card from '@/components/shared/Card';
import SaveSimulationModal from '@/components/modals/SaveSimulationModal';
import { Play, Pause, RotateCcw, SkipForward, ChevronDown, ChevronUp, Lock, Users, Coffee, Scissors, BookOpen, Key, GitCommit, GitMerge, AlertTriangle, Activity, Gauge, TrendingUp, Zap, CheckCircle, Save } from 'lucide-react';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import QuizModal from '@/components/modals/QuizModal';

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

const createInitialState = (mode: SyncSimulationMode, customConfig?: any): SimState => {
  const config = customConfig ?? INITIAL_CONFIGS[mode];
  let threads: SyncThread[] = [];
  let resources: any = {};

  switch (mode) {
    case 'MUTEX': {
      threads = Array.from({ length: config.threadCount }, (_, i) => ({
        id: i, name: `T${i}`, state: 'IDLE', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
        message: 'Idle', actionTimer: 0,
      }));
      resources = { mutexLocked: false, owner: null, queue: [] };
      break;
    }
    case 'SEMAPHORE': {
      const total = config.producers + config.consumers;
      threads = Array.from({ length: total }, (_, i) => ({
        id: i, name: i < config.producers ? `Prod ${i}` : `Cons ${i - config.producers}`,
        state: 'IDLE', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
        message: 'Idle', actionTimer: 0,
      }));
      resources = { buffer: [], mutex: 1, empty: config.bufferSize, full: 0 };
      break;
    }
    case 'READERS_WRITERS': {
      const rw_total = config.readers + config.writers;
      threads = Array.from({ length: rw_total }, (_, i) => ({
        id: i, name: i < config.readers ? `Reader ${i}` : `Writer ${i - config.readers}`,
        state: 'IDLE', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
        message: 'Idle', actionTimer: 0,
      }));
      resources = { readers: 0, writerActive: false, queue: [] };
      break;
    }
    case 'DINING_PHILOSOPHERS': {
      threads = Array.from({ length: config.count }, (_, i) => ({
        id: i, name: `P${i}`, state: 'THINKING', progress: 0, color: THREAD_COLORS[i % THREAD_COLORS.length],
        message: 'Thinking...', actionTimer: Math.random() * config.thinkTime,
        leftFork: i, rightFork: (i + 1) % config.count,
      }));
      resources = { forks: Array(config.count).fill(null) };
      break;
    }
    default:
      break;
  }
  const modeDef = SIMULATION_MODES.find(m => m.id === mode);
  return {
    mode, config, threads, resources,
    metrics: { avgWaitTime: 0, throughput: 0, lockContention: 0, deadlocks: 0, itemsProduced: 0, itemsConsumed: 0, customersServed: 0, customersTurnedAway: 0, totalAcquisitions: 0, totalWaits: 0 },
    log: [{ id: Date.now(), message: `Initialized ${modeDef ? modeDef.name : mode} simulation.`, type: 'info', timestamp: new Date().toLocaleTimeString() }],
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
    case 'UPDATE_CONFIG': {
        const newConfig = { ...state.config, [action.payload.key]: action.payload.value };
        return createInitialState(state.mode, newConfig);
    }
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


  // Export and History state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

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



  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">Threads & Synchronization</h1>
        <button
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg"
        >
            <BookOpen size={18} />
            <span>Take Quiz</span>
        </button>
      </div>

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
                            ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-md scale-105' 
                            : 'bg-muted text-text-primary hover:bg-muted/80'
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
          <Card className="p-4 sm:p-5 h-[600px] relative bg-panel border-white/40 dark:border-white/10 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-glow"></div>
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
            <div className="mb-4 p-3 rounded-lg bg-panel shadow-recessed border border-white/40 dark:border-white/10">
              <h3 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                <Play size={14} />
                Playback
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => dispatch({type: state.isRunning ? 'PAUSE' : 'START'})} 
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 text-sm ${
                    state.isRunning 
                      ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg hover:from-orange-600 hover:to-amber-700' 
                      : 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg hover:from-teal-600 hover:to-cyan-700'
                  }`}
                >
                  {state.isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Start</>}
                </button>
                <button 
                  onClick={() => dispatch({type: 'STEP'})} 
                  disabled={state.isRunning} 
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                >
                  <SkipForward size={16}/> Step
                </button>
              </div>
            </div>

            {/* Reset Control */}
            <div className="mb-4 p-3 rounded-lg bg-panel shadow-recessed border border-white/40 dark:border-white/10">
              <h3 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                <RotateCcw size={14} />
                Reset
              </h3>
              <button 
                onClick={() => dispatch({type: 'RESET'})} 
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg text-sm"
              >
                <RotateCcw size={16}/> Reset Simulation
              </button>
            </div>

            {/* Speed Control */}
            <div className="mb-4 p-3 rounded-lg bg-panel shadow-recessed border border-white/40 dark:border-white/10">
              <h3 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
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
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Deadlock Resolution (Conditional) */}
            {state.mode === 'DINING_PHILOSOPHERS' && state.metrics.deadlocks > 0 && (
              <div className="p-3 rounded-lg bg-panel shadow-recessed border-2 border-red-500 animate-pulse">
                <h3 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Deadlock Detected!
                </h3>
                <button 
                  onClick={() => dispatch({ type: 'RESOLVE_DEADLOCK' })} 
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg text-sm"
                >
                  <AlertTriangle size={16}/> Resolve Deadlock
                </button>
              </div>
            )}

            {/* Save Simulation */}
            {state.threads.length > 0 && (
              <div className="p-3 rounded-lg bg-panel shadow-recessed border border-white/40 dark:border-white/10">
                <button onClick={() => setIsSaveModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg text-sm" title="Save current state to database">
                  <Save size={16} />
                  <span>Save Simulation</span>
                </button>
              </div>
            )}
          </Card>
          <MetricsPanel state={state}/>
          <LogPanel log={state.log}/>
        </div>
      </div>

      <SaveSimulationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        algorithmType="threads-sync"
        simulationState={{
          mode: state.mode,
          config: state.config,
          threads: state.threads,
          metrics: state.metrics
        }}
        defaultName={`${state.mode} Simulation`}
      />

      <QuizModal 
          isOpen={isQuizOpen} 
          onClose={() => setIsQuizOpen(false)} 
          moduleId="threads-sync" 
      />

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
                    <label className="text-sm font-medium text-text-muted">Prevent Deadlock</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.preventDeadlock} onChange={e => onUpdate('preventDeadlock', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                    </label>
                </div>
            </>;
            default: return <p className="text-sm text-text-muted">No configuration for this mode.</p>;
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
        <label className="text-sm font-medium text-text-muted">{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} {...props} className="w-full p-2 mt-1 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300" />
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
                <div className="p-3 col-span-2 bg-panel shadow-recessed border border-white/40 dark:border-white/10 rounded-lg text-text-primary font-bold flex items-center justify-center gap-2 animate-pulse">
                    <AlertTriangle size={18}/> DEADLOCKED
                </div>
            }
        </div>
    </Card>
)};

const MetricBox: React.FC<{label:string, value:number, unit?:string, color:string}> = ({label, value, unit, color}) => {
    const gradientMap: Record<string, string> = {
        teal: 'bg-background shadow-recessed border-border-light text-text-primary',
        cyan: 'bg-background shadow-recessed border-border-light text-text-primary',
        blue: 'bg-background shadow-recessed border-border-light text-text-primary',
        green: 'bg-background shadow-recessed border-border-light text-text-primary',
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
                    : 'bg-muted';
                    
                return (
                    <div key={entry.id} className={`flex items-start gap-2 p-2 rounded ${bgColor}`}>
                        <p className="text-text-muted flex-shrink-0 text-[10px]">{entry.timestamp}</p>
                        <p className="flex-grow break-words text-[11px]">{entry.message}</p>
                    </div>
                );
            })}
        </div>
    </Card>
);


const STATE_BADGE: Record<string, string> = {
  IDLE:     'bg-gray-400/20 text-gray-400 border-gray-400/30',
  WAITING:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ACTIVE:   'bg-green-500/20 text-green-400 border-green-500/30',
  BLOCKED:  'bg-red-500/20 text-red-400 border-red-500/30',
  THINKING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HUNGRY:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  EATING:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  FINISHED: 'bg-gray-700/20 text-gray-500 border-gray-700/30',
};

const ThreadCard: React.FC<{ t: SyncThread; compact?: boolean; deadlocked?: boolean }> = ({ t, compact, deadlocked }) => (
  <div className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-500 ${
    deadlocked ? 'border-red-500 bg-red-500/10 animate-pulse' : 'border-white/20 bg-panel shadow-card'
  } ${compact ? 'text-xs' : 'text-sm'}`}>
    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
    <span className="font-bold text-text-primary truncate">{t.name}</span>
    <span className={`ml-auto px-1.5 py-0.5 rounded border text-[10px] font-semibold flex-shrink-0 ${STATE_BADGE[t.state] ?? 'bg-gray-400/20 text-gray-400 border-gray-400/30'}`}>
      {t.state}
    </span>
  </div>
);

const VisualizationPanel: React.FC<{ state: SimState }> = ({ state }) => {
    const { mode, threads, resources, config, metrics } = state;

    /* ── MUTEX ──────────────────────────────────────────────────────── */
    if (mode === 'MUTEX') {
      const idle    = threads.filter(t => t.state === 'IDLE');
      const waiting = threads.filter(t => t.state === 'WAITING');
      const active  = threads.find(t => t.state === 'ACTIVE');

      return (
        <div className="w-full h-full flex flex-col gap-3 p-2 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-text-muted font-mono">
            <span>Lock: <span className={resources.mutexLocked ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{resources.mutexLocked ? '🔒 LOCKED' : '🔓 FREE'}</span></span>
            <span>Queue: {waiting.length} thread{waiting.length !== 1 ? 's' : ''} waiting</span>
          </div>

          <div className="flex gap-3 flex-1 min-h-0">
            {/* Idle threads */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-1">Idle</p>
              <div className="flex-1 bg-background/50 rounded-xl border border-white/10 p-2 space-y-1.5 overflow-y-auto">
                {idle.length === 0 && <p className="text-[10px] text-text-muted text-center pt-4">—</p>}
                {idle.map(t => <ThreadCard key={t.id} t={t} compact />)}
              </div>
            </div>

            {/* Waiting Queue */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-widest mb-1">Waiting Queue</p>
              <div className="flex-1 bg-yellow-500/5 rounded-xl border border-yellow-500/20 p-2 space-y-1.5 overflow-y-auto">
                {waiting.length === 0 && <p className="text-[10px] text-text-muted text-center pt-4">Empty</p>}
                {waiting.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-yellow-500 font-mono w-4">#{i+1}</span>
                    <div className="flex-1"><ThreadCard t={t} compact /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Section */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-teal-400 uppercase tracking-widest mb-1">Critical Section</p>
              <div className={`flex-1 rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all duration-500 ${
                active ? 'border-teal-500 bg-teal-500/10 shadow-lg' : 'border-dashed border-white/20 bg-background/30'
              }`}>
                {active ? (
                  <>
                    <div className="w-10 h-10 rounded-full border-2 border-teal-400 flex items-center justify-center mb-2" style={{ backgroundColor: active.color + '33' }}>
                      <span className="text-xs font-bold text-white">{active.name}</span>
                    </div>
                    <span className="text-[10px] text-teal-400 font-semibold">In Critical Section</span>
                    {active.actionTimer !== undefined && (
                      <div className="w-full mt-2 bg-white/10 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-teal-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, (1 - active.actionTimer / config.csDuration) * 100)}%` }} />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-text-muted">Empty</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── SEMAPHORE ──────────────────────────────────────────────────── */
    if (mode === 'SEMAPHORE') {
      const producers = threads.filter((_, i) => i < config.producers);
      const consumers = threads.filter((_, i) => i >= config.producers);
      const bufferFill = resources.buffer?.length ?? 0;

      return (
        <div className="w-full h-full flex flex-col gap-3 p-2 overflow-auto">
          {/* Buffer visualization */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
              Shared Buffer ({bufferFill}/{config.bufferSize})
            </p>
            <div className="flex gap-1.5 bg-background/50 rounded-xl border border-teal-500/30 px-3 py-2">
              {Array.from({ length: config.bufferSize }).map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all duration-500 ${
                  i < bufferFill
                    ? 'border-teal-400 bg-teal-400/30 shadow-md'
                    : 'border-white/20 bg-white/5'
                }`}>
                  {i < bufferFill && <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />}
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-[10px] text-text-muted font-mono">
              <span>Empty: {resources.empty ?? 0}</span>
              <span>Full: {resources.full ?? 0}</span>
              <span>Mutex: {resources.mutex ?? 0}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-1 min-h-0">
            {/* Producers */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest mb-1">Producers</p>
              <div className="flex-1 bg-blue-500/5 rounded-xl border border-blue-500/20 p-2 space-y-1.5 overflow-y-auto">
                {producers.map(t => (
                  <div key={t.id}>
                    <ThreadCard t={t} compact />
                    {t.state === 'ACTIVE' && t.actionTimer !== undefined && (
                      <div className="mt-1 mx-1 bg-white/10 rounded-full h-1">
                        <div className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, (1 - t.actionTimer / config.produceTime) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Consumers */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-widest mb-1">Consumers</p>
              <div className="flex-1 bg-purple-500/5 rounded-xl border border-purple-500/20 p-2 space-y-1.5 overflow-y-auto">
                {consumers.map(t => (
                  <div key={t.id}>
                    <ThreadCard t={t} compact />
                    {t.state === 'ACTIVE' && t.actionTimer !== undefined && (
                      <div className="mt-1 mx-1 bg-white/10 rounded-full h-1">
                        <div className="h-1 rounded-full bg-purple-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, (1 - t.actionTimer / config.consumeTime) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── READERS-WRITERS ─────────────────────────────────────────────── */
    if (mode === 'READERS_WRITERS') {
      const readers = threads.filter((_, i) => i < config.readers);
      const writers = threads.filter((_, i) => i >= config.readers);

      return (
        <div className="w-full h-full flex flex-col gap-3 p-2 overflow-auto">
          {/* Shared Resource status */}
          <div className={`flex items-center justify-center gap-3 py-2 px-4 rounded-xl border-2 transition-all duration-500 ${
            resources.writerActive
              ? 'border-red-500 bg-red-500/10'
              : resources.readers > 0
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-dashed border-white/20 bg-background/30'
          }`}>
            <span className="text-sm font-bold text-text-primary">📖 Shared Resource</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              resources.writerActive
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : resources.readers > 0
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
            }`}>
              {resources.writerActive ? '✎ Writing' : resources.readers > 0 ? `👁 ${resources.readers} Reader${resources.readers > 1 ? 's' : ''}` : 'Idle'}
            </span>
          </div>

          <div className="flex gap-3 flex-1 min-h-0">
            {/* Readers column */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-widest mb-1">Readers</p>
              <div className="flex-1 bg-cyan-500/5 rounded-xl border border-cyan-500/20 p-2 space-y-1.5 overflow-y-auto">
                {readers.map(t => <ThreadCard key={t.id} t={t} compact />)}
              </div>
            </div>

            {/* Writers column */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-widest mb-1">Writers</p>
              <div className="flex-1 bg-red-500/5 rounded-xl border border-red-500/20 p-2 space-y-1.5 overflow-y-auto">
                {writers.map(t => <ThreadCard key={t.id} t={t} compact />)}
              </div>
            </div>
          </div>

          {/* Waiting queue */}
          {resources.queue?.length > 0 && (
            <div className="bg-yellow-500/5 rounded-xl border border-yellow-500/20 p-2">
              <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-widest mb-1.5">Waiting Queue ({resources.queue.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {resources.queue.map((req: any, i: number) => {
                  const t = threads.find(th => th.id === req.id);
                  if (!t) return null;
                  return (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-[10px]">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-bold text-white">{t.name}</span>
                      <span className="text-yellow-400">{req.type === 'R' ? 'R' : 'W'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ── DINING PHILOSOPHERS ─────────────────────────────────────────── */
    if (mode === 'DINING_PHILOSOPHERS') {
      const n = threads.length;
      return (
        <div className="w-full h-full flex flex-col gap-2 p-2 overflow-auto">
          {metrics.deadlocks > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs font-bold animate-pulse">
              <span>⚠</span> DEADLOCK DETECTED — Each philosopher is holding one fork!
            </div>
          )}

          {/* Circular table display */}
          <div className="relative flex-1 flex items-center justify-center min-h-[220px]">
            {/* Center table */}
            <div className="absolute w-24 h-24 rounded-full border-2 border-teal-500 bg-teal-500/10 flex items-center justify-center z-10">
              <span className="text-[10px] text-teal-400 font-semibold text-center leading-tight">Dining<br/>Table</span>
            </div>

            {/* Philosophers around table */}
            {threads.map((p, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              const radius = 110;
              const left = 50 + Math.cos(angle) * radius * 0.44 + '%';
              const top  = 50 + Math.sin(angle) * radius * 0.44 + '%';
              const isDeadlocked = metrics.deadlocks > 0 && p.state === 'HUNGRY';
              const stateColor =
                p.state === 'EATING' ? '#a855f7' :
                p.state === 'HUNGRY' ? '#f97316' :
                p.state === 'THINKING' ? '#3b82f6' : '#9ca3af';

              return (
                <div key={p.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
                  style={{ left, top }}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[11px] font-bold text-white shadow-lg transition-all duration-500 ${
                    isDeadlocked ? 'border-red-500 animate-pulse' : ''
                  }`} style={{ backgroundColor: stateColor, borderColor: isDeadlocked ? '#ef4444' : stateColor }}>
                    {p.name}
                  </div>
                  <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-full ${
                    p.state === 'EATING' ? 'bg-purple-500/20 text-purple-400' :
                    p.state === 'HUNGRY' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{p.state}</span>
                </div>
              );
            })}

            {/* Forks between philosophers */}
            {Array.from({ length: n }).map((_, i) => {
              const angle = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
              const forkRadius = 65;
              const left = 50 + Math.cos(angle) * forkRadius * 0.44 + '%';
              const top  = 50 + Math.sin(angle) * forkRadius * 0.44 + '%';
              const isTaken = resources.forks?.[i] !== null && resources.forks?.[i] !== undefined;

              return (
                <div key={`fork-${i}`} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] transition-all duration-500 ${
                    isTaken
                      ? 'border-yellow-400 bg-yellow-400/30 text-yellow-300 shadow-md'
                      : 'border-white/20 bg-white/5 text-white/30'
                  }`}>
                    🍴
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center text-[10px]">
            {[['THINKING','bg-blue-500','Thinking'],['HUNGRY','bg-orange-500','Hungry'],['EATING','bg-purple-500','Eating']].map(([,color,label]) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-text-muted">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-text-muted">Fork (taken)</span>
            </div>
          </div>
        </div>
      );
    }

    return <div className="flex items-center justify-center h-full text-text-muted text-sm">Select a simulation mode to begin.</div>;
};

export default ThreadsAndSyncPage;

