import React, { useState, useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import type { SyncSimulationMode, SyncThread, ThreadState, SyncMetrics, LogEntry } from '../types';
import Card from '../components/Card';
import { Play, Pause, RotateCcw, SkipForward, ChevronDown, ChevronUp, Lock, Users, Coffee, Scissors, BookOpen, Key, GitCommit, GitMerge, AlertTriangle } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Threads & Synchronization</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4">
              <h2 className="text-xl font-semibold mb-3">Simulation Mode</h2>
              <div className="space-y-1">
                {SIMULATION_MODES.map(m => (
                    <button key={m.id} onClick={() => dispatch({type: 'SET_MODE', payload: m.id})}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-colors ${state.mode === m.id ? 'bg-accent/10 text-accent' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                        <m.icon size={16} /> {m.name}
                    </button>
                ))}
              </div>
          </Card>
          <ConfigPanel mode={state.mode} config={state.config} onUpdate={handleUpdateConfig} />
        </div>

        {/* Center Panel */}
        <div className="lg:col-span-6">
          <Card className="p-4 h-[600px] relative">
            <VisualizationPanel state={state} />
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-3">Controls</h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={()=> dispatch({type: state.isRunning ? 'PAUSE':'START'})} className="btn-primary">{state.isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Start</>}</button>
                <button onClick={()=> dispatch({type: 'STEP'})} disabled={state.isRunning} className="btn-secondary disabled:opacity-50"><SkipForward size={16}/> Step</button>
                <button onClick={()=> dispatch({type: 'RESET'})} className="btn-secondary col-span-2"><RotateCcw size={16}/> Reset</button>
                 {state.mode === 'DINING_PHILOSOPHERS' && state.metrics.deadlocks > 0 && (
                    <button onClick={() => dispatch({ type: 'RESOLVE_DEADLOCK' })} className="btn-danger col-span-2">
                        <AlertTriangle size={16}/> Resolve Deadlock
                    </button>
                )}
            </div>
            <label className="text-sm font-medium">Speed</label>
            <input type="range" min="50" max="950" value={1000 - state.speed} onChange={e => dispatch({type: 'SET_SPEED', payload: Number(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
          </Card>
          <MetricsPanel state={state}/>
          <LogPanel log={state.log}/>
        </div>
      </div>
       <Card className="p-4">
          <button onClick={() => setIsEduOpen(!isEduOpen)} className="w-full flex justify-between items-center text-left">
              <h2 className="text-xl font-semibold">{educationalContent.title}</h2>
              {isEduOpen ? <ChevronUp/> : <ChevronDown/>}
          </button>
          {isEduOpen && <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">{educationalContent.content}</p>}
       </Card>
      <style>{`
        .btn-primary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-colors; }
        .btn-secondary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors; }
        .btn-danger { @apply flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors; }
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
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                    </label>
                </div>
            </>;
            default: return <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No configuration for this mode.</p>;
        }
    }
    return <Card className="p-4"><h2 className="text-xl font-semibold mb-3">Configuration</h2><div className="space-y-3">{content()}</div></Card>;
}

const ConfigInput: React.FC<{label:string, value:number, onChange:(v:number)=>void, min?:number, max?:number, step?:number}> = ({label, value, onChange, ...props}) => (
    <div>
        <label className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} {...props} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none" />
    </div>
);

const MetricsPanel: React.FC<{state:SimState}> = ({state}) => {
    const { metrics, time, mode } = state;
    return (
    <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Metrics</h2>
        <div className="grid grid-cols-2 gap-3 text-center">
            <MetricBox label="Time" value={time} unit=" ticks"/>
            {mode === 'MUTEX' && <>
                <MetricBox label="Acquisitions" value={metrics.totalAcquisitions} />
                <MetricBox label="Total Waits" value={metrics.totalWaits} />
            </>}
            {mode === 'SEMAPHORE' && <>
                <MetricBox label="Items Produced" value={metrics.itemsProduced} />
                <MetricBox label="Items Consumed" value={metrics.itemsConsumed} />
            </>}
            {mode === 'DINING_PHILOSOPHERS' && metrics.deadlocks > 0 && 
                <div className="p-2 col-span-2 bg-red-500/10 rounded-lg text-red-500 font-bold flex items-center justify-center gap-2">
                    <AlertTriangle size={16}/> DEADLOCKED
                </div>
            }
        </div>
    </Card>
)};

const MetricBox: React.FC<{label:string, value:number, unit?:string}> = ({label, value, unit}) => (
    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{label}</p>
        <div className="text-lg font-bold"><AnimatedNumber value={value} precision={0}/>{unit}</div>
    </div>
);

const LogPanel: React.FC<{log: LogEntry[]}> = ({log}) => (
    <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Event Log</h2>
        <div className="h-48 overflow-y-auto space-y-2 text-xs font-mono">
            {log.map(entry => (
                <div key={entry.id} className="flex items-start gap-1.5">
                    <p className="text-text-muted-light dark:text-text-muted-dark flex-shrink-0">{entry.timestamp}</p>
                    <p className="flex-grow break-words">{entry.message}</p>
                </div>
            ))}
        </div>
    </Card>
);

const VisualizationPanel: React.FC<{state: SimState}> = ({state}) => {
    const { mode, threads, resources, config, metrics } = state;
    
    const ThreadComponent: React.FC<{t:SyncThread, x:number, y:number, isDeadlocked?: boolean}> = ({t, x, y, isDeadlocked = false}) => (
        <g transform={`translate(${x}, ${y})`} className="group transition-transform duration-500 ease-in-out cursor-pointer">
            <circle cx="0" cy="0" r="22" fill={t.color} stroke={isDeadlocked ? '#ef4444' : '#fff'} strokeWidth={isDeadlocked ? 4 : 2} className={isDeadlocked ? 'animate-pulse' : ''} />
            <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" style={{pointerEvents: 'none'}}>{t.name}</text>
            <title>{t.name}: {t.message}</title>
        </g>
    );

    switch(mode) {
        case 'MUTEX': return <svg width="100%" height="100%" viewBox="0 0 400 600">
            <rect x="150" y="250" width="100" height="100" fill="rgba(59, 130, 246, 0.1)" strokeDasharray="5" stroke="#3b82f6" rx="10"/>
            <text x="200" y="240" textAnchor="middle" fontWeight="bold" className="fill-current">Critical Section</text>
            {resources.owner !== null && <Lock x="185" y="285" size={30} className="text-accent" />}
            {threads.map((t) => {
                 let x = 75, y = 100 + t.id * 80;
                 if (t.state === 'ACTIVE') { x = 200; y = 300; }
                 if (t.state === 'WAITING') { x = 200; y = 100 + resources.queue.indexOf(t.id) * 50 }
                 return <ThreadComponent key={t.id} t={t} x={x} y={y} />
            })}
        </svg>;
        case 'SEMAPHORE': return <svg width="100%" height="100%" viewBox="0 0 400 600">
            <text x="200" y="30" textAnchor="middle" fontWeight="bold" className="fill-current">Shared Buffer ({resources.buffer.length}/{config.bufferSize})</text>
            {Array.from({length: config.bufferSize}).map((_, i) => (
                <rect key={i} x={30 + i * 45} y="50" width="40" height="40" stroke="#9ca3af" fill={i < resources.buffer.length ? '#3b82f6' : 'transparent'} rx="5"/>
            ))}
            {threads.map((t, i) => {
                const isProducer = i < config.producers;
                let x = isProducer ? 75 : 325;
                let y = 200 + t.id * 80;
                return <ThreadComponent key={t.id} t={t} x={x} y={y} />
            })}
        </svg>;
        case 'READERS_WRITERS': return <svg width="100%" height="100%" viewBox="0 0 400 600">
            <rect x="100" y="200" width="200" height="200" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeDasharray="5" rx="10"/>
            <text x="200" y="190" textAnchor="middle" fontWeight="bold" className="fill-current">Shared Resource</text>
            <text x="200" y="390" textAnchor="middle" className="fill-current">Readers: {resources.readers} {resources.writerActive ? '| Writer Active' : ''}</text>
             {threads.map((t, i) => {
                const isReader = i < config.readers;
                let x = isReader ? 50 : 350;
                let y = 100 + t.id * 60;
                if(t.state === 'ACTIVE') { x = 200; y = 250 + (t.id % 4) * 40; }
                if(t.state === 'WAITING') { x = isReader ? 120 : 280; y = 100 + resources.queue.findIndex((q:any) => q.id === t.id) * 50; }
                return <ThreadComponent key={t.id} t={t} x={x} y={y} />
            })}
        </svg>;
        case 'DINING_PHILOSOPHERS': {
            const R = 150, CX=200, CY=300;
            return <svg width="100%" height="100%" viewBox="0 0 400 600">
                <circle cx={CX} cy={CY} r={R-40} fill="#f3f4f6" stroke="#d1d5db"/>
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
                    const color = owner ? owner.color : '#9ca3af';

                    return <g key={i} transform={`translate(${CX + Math.cos(angle)*(R-60)}, ${CY + Math.sin(angle)*(R-60)})`}>
                        <Key size={25} style={{color: color}} />
                    </g>;
                })}
            </svg>;
        }
        default: return <p>Visualization not available for this mode.</p>;
    }
}
export default ThreadsAndSyncPage;
