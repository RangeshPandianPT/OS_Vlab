import React, { useState, useEffect, useCallback, useReducer, useMemo, useRef } from 'react';
import type { SimulatedProcess, ProcessState, ProcessSimulationMode } from '@/types';
import Card from '@/components/shared/Card';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import ProcessPCBModal from '@/components/modals/ProcessPCBModal';
import SaveSimulationModal from '@/components/modals/SaveSimulationModal';
import QuizModal from '@/components/modals/QuizModal';
import { Play, Pause, RotateCcw, Plus, SkipForward, Cpu, Workflow, Activity, Gauge, TrendingUp, Zap, Clock, BookOpen, CheckCircle, Save } from 'lucide-react';

const colors = [
  '#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899',
  '#6366f1', '#f59e0b', '#d946ef', '#06b6d4', '#22c55e', '#e11d48'
];

const stateColors: Record<ProcessState, string> = {
  NEW: 'bg-blue-500',
  READY: 'bg-green-500',
  RUNNING: 'bg-orange-500',
  WAITING: 'bg-yellow-500',
  TERMINATED: 'bg-red-500',
};

// --- STATE MANAGEMENT (REDUCER) ---

const initialLifecycleState = {
  processes: [] as SimulatedProcess[],
  time: 0,
  runningProcessId: null as number | null,
  isSimulationRunning: false,
  contextSwitchTime: 1,
  contextSwitchCountdown: 0,
  nextProcessToRun: null as number | null,
  metrics: { contextSwitches: 0, totalCpuTime: 0, completedProcessCount: 0 },
  lastTransition: null as { processId: number, from: ProcessState, to: ProcessState } | null,
};

const initialState = {
  mode: 'LIFECYCLE' as ProcessSimulationMode,
  lifecycle: initialLifecycleState,
};

type State = typeof initialState;

type Action = 
  | { type: 'SET_MODE'; payload: ProcessSimulationMode }
  | { type: 'LIFECYCLE_TICK' }
  | { type: 'LIFECYCLE_START' }
  | { type: 'LIFECYCLE_PAUSE' }
  | { type: 'LIFECYCLE_STEP' }
  | { type: 'LIFECYCLE_RESET'; payload: { processes: SimulatedProcess[], contextSwitchTime: number } }
  | { type: 'LIFECYCLE_ADD_PROCESS'; payload: SimulatedProcess };

function simulationReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'LIFECYCLE_TICK': {
      if (!state.lifecycle.isSimulationRunning) return state;
      
      const newState: State = JSON.parse(JSON.stringify(state));
      const lifecycle = newState.lifecycle;
      lifecycle.time++;
      lifecycle.lastTransition = null;

      lifecycle.processes.forEach(p => {
        if (p.state === 'NEW' && p.arrivalTime <= lifecycle.time) {
          p.state = 'READY';
          lifecycle.lastTransition = { processId: p.id, from: 'NEW', to: 'READY' };
        }
      });
      
      if (lifecycle.contextSwitchCountdown > 0) {
        lifecycle.contextSwitchCountdown--;
        if (lifecycle.contextSwitchCountdown === 0) {
            lifecycle.runningProcessId = lifecycle.nextProcessToRun;
            if (lifecycle.runningProcessId) {
                const newRunningProcess = lifecycle.processes.find(p => p.id === lifecycle.runningProcessId);
                if (newRunningProcess) {
                  const oldState = newRunningProcess.state;
                  newRunningProcess.state = 'RUNNING';
                  lifecycle.lastTransition = { processId: newRunningProcess.id, from: oldState, to: 'RUNNING' };
                }
            }
            lifecycle.nextProcessToRun = null;
        }
        return newState;
      }
      
      lifecycle.processes.forEach(p => {
          if(p.state === 'WAITING') {
              p.ioCountdown--;
              if(p.ioCountdown <= 0) {
                p.state = 'READY';
                lifecycle.lastTransition = { processId: p.id, from: 'WAITING', to: 'READY' };
              }
          }
      });

      let runningProcess = lifecycle.processes.find(p => p.id === lifecycle.runningProcessId);
      if (runningProcess) {
        runningProcess.remainingBurstTime--;
        runningProcess.cpuTime++;
        lifecycle.metrics.totalCpuTime++;
        
        if (runningProcess.remainingBurstTime <= 0) {
          const oldState = runningProcess.state;
          runningProcess.state = 'TERMINATED';
          lifecycle.lastTransition = { processId: runningProcess.id, from: oldState, to: 'TERMINATED' };
          runningProcess.completionTime = lifecycle.time;
          runningProcess.turnaroundTime = runningProcess.completionTime - runningProcess.arrivalTime;
          lifecycle.metrics.completedProcessCount++;
          lifecycle.runningProcessId = null;
        }
        else if (Math.random() < runningProcess.ioFrequency) {
          const oldState = runningProcess.state;
          runningProcess.state = 'WAITING';
          lifecycle.lastTransition = { processId: runningProcess.id, from: oldState, to: 'WAITING' };
          runningProcess.ioCountdown = runningProcess.ioDuration;
          lifecycle.runningProcessId = null;
        }
      }

      const readyProcesses = lifecycle.processes.filter(p => p.state === 'READY');
      const currentRunningProcess = lifecycle.processes.find(p => p.id === lifecycle.runningProcessId);
      
      if (readyProcesses.length > 0) {
          readyProcesses.sort((a, b) => a.remainingBurstTime - b.remainingBurstTime);
          const bestReadyProcess = readyProcesses[0];

          if (!currentRunningProcess || (currentRunningProcess && bestReadyProcess.id !== currentRunningProcess.id && bestReadyProcess.remainingBurstTime < currentRunningProcess.remainingBurstTime)) {
              if (currentRunningProcess) {
                  const oldState = currentRunningProcess.state;
                  currentRunningProcess.state = 'READY';
                  lifecycle.lastTransition = { processId: currentRunningProcess.id, from: oldState, to: 'READY' };
              }
              lifecycle.nextProcessToRun = bestReadyProcess.id;
              lifecycle.runningProcessId = null;
              lifecycle.contextSwitchCountdown = lifecycle.contextSwitchTime;
              if (lifecycle.contextSwitchTime > 0) lifecycle.metrics.contextSwitches++;
          }
      }
      
      lifecycle.processes.forEach(p => {
        if (p.state === 'READY') p.waitingTime++;
      });

      return newState;
    }
    case 'LIFECYCLE_START':
      return { ...state, lifecycle: { ...state.lifecycle, isSimulationRunning: true } };
    case 'LIFECYCLE_PAUSE':
      return { ...state, lifecycle: { ...state.lifecycle, isSimulationRunning: false } };
    case 'LIFECYCLE_STEP': {
        const nextState = simulationReducer({ ...state, lifecycle: { ...state.lifecycle, isSimulationRunning: true } }, { type: 'LIFECYCLE_TICK' });
        return { ...nextState, lifecycle: { ...nextState.lifecycle, isSimulationRunning: false } };
    }
    case 'LIFECYCLE_RESET':
      return { ...state, lifecycle: { ...initialLifecycleState, processes: action.payload.processes, contextSwitchTime: action.payload.contextSwitchTime } };
    case 'LIFECYCLE_ADD_PROCESS':
       return { ...state, lifecycle: { ...state.lifecycle, processes: [...state.lifecycle.processes, action.payload] } };

    default:
      return state;
  }
}

const generateProcesses = (num: number, avgBurst: number, arrivalInterval: number): SimulatedProcess[] => {
    return Array.from({ length: num }, (_, i) => {
        const burstTime = Math.max(2, Math.round(avgBurst + (Math.random() - 0.5) * avgBurst * 0.8));
        return {
            id: i + 1, name: `P${i + 1}`, arrivalTime: i * arrivalInterval, totalBurstTime: burstTime,
            remainingBurstTime: burstTime, state: 'NEW', cpuTime: 0, waitingTime: 0,
            priority: Math.floor(Math.random() * 10) + 1, color: colors[i % colors.length],
            ioFrequency: 0.05 + Math.random() * 0.1, ioDuration: 3 + Math.floor(Math.random() * 5),
            ioCountdown: 0, pc: Math.floor(Math.random() * 1024),
            registers: { R1: 0, R2: 0, R3: 0, R4: 0 }, memoryAddress: 0x1000 + (i * 0x100),
        };
    });
};

const ProcessManagementPage: React.FC = () => {
  const [config, setConfig] = useState({ numProcesses: 5, avgBurstTime: 15, arrivalInterval: 3, contextSwitchTime: 1 });
  const [selectedProcess, setSelectedProcess] = useState<SimulatedProcess | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const initialProcesses = useMemo(() => generateProcesses(config.numProcesses, config.avgBurstTime, config.arrivalInterval), [config.numProcesses, config.avgBurstTime, config.arrivalInterval]);
  
  const [state, dispatch] = useReducer(simulationReducer, {
    ...initialState,
    lifecycle: { ...initialState.lifecycle, processes: initialProcesses, contextSwitchTime: config.contextSwitchTime }
  });
  
  const timerRef = useRef<number | null>(null);

  const startSimulationLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => dispatch({ type: 'LIFECYCLE_TICK' }), 500);
  }, []);
  
  useEffect(() => {
    if(state.lifecycle.isSimulationRunning){
        startSimulationLoop();
    } else {
        if(timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if(timerRef.current) clearInterval(timerRef.current) };
  }, [state.lifecycle.isSimulationRunning, startSimulationLoop]);

  const handleReset = useCallback(() => {
      dispatch({ 
        type: 'LIFECYCLE_RESET', 
        payload: { processes: generateProcesses(config.numProcesses, config.avgBurstTime, config.arrivalInterval), contextSwitchTime: config.contextSwitchTime } 
      });
  }, [config]);

  useEffect(() => {
    handleReset();
  }, [state.mode, handleReset]);

  const handleAddProcess = () => {
    const { processes, time } = state.lifecycle;
    const newId = processes.length > 0 ? Math.max(...processes.map(p => p.id)) + 1 : 1;
    const lastArrivalTime = processes.length > 0 ? processes.reduce((max, p) => Math.max(p.arrivalTime, max), 0) : -config.arrivalInterval;
    const burstTime = Math.max(2, Math.round(config.avgBurstTime + (Math.random() - 0.5) * config.avgBurstTime));
    const newProcess: SimulatedProcess = {
        id: newId, name: `P${newId}`, arrivalTime: Math.max(time, lastArrivalTime + config.arrivalInterval),
        totalBurstTime: burstTime, remainingBurstTime: burstTime, state: 'NEW', cpuTime: 0, waitingTime: 0,
        priority: Math.floor(Math.random() * 10) + 1, color: colors[(newId - 1) % colors.length],
        ioFrequency: 0.05 + Math.random() * 0.1, ioDuration: 3 + Math.floor(Math.random() * 5),
        ioCountdown: 0, pc: Math.floor(Math.random() * 1024),
        registers: { R1: 0, R2: 0, R3: 0, R4: 0 }, memoryAddress: 0x1000 + ((newId -1) * 0x100),
    };
    dispatch({ type: 'LIFECYCLE_ADD_PROCESS', payload: newProcess });
  };
  
  const calculatedMetrics = useMemo(() => {
      const { processes, time, metrics } = state.lifecycle;
      const completedProcesses = processes.filter(p => p.state === 'TERMINATED');
      const totalWaitingTime = completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0);
      const totalTurnaroundTime = completedProcesses.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0);
      const averageWaitingTime = completedProcesses.length > 0 ? totalWaitingTime / completedProcesses.length : 0;
      const averageTurnaroundTime = completedProcesses.length > 0 ? totalTurnaroundTime / completedProcesses.length : 0;
      const cpuUtilization = time > 0 ? (metrics.totalCpuTime / time) * 100 : 0;
      return { averageWaitingTime, averageTurnaroundTime, cpuUtilization, contextSwitches: metrics.contextSwitches };
  }, [state.lifecycle]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">Process Management</h1>
        <button
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg"
        >
            <BookOpen size={18} />
            <span>Take Quiz</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        
        {/* Left Panel: Configuration and Metrics */}
        <aside className="space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-violet-500" size={20} />
              Simulation Mode
            </h2>
            <div className="flex bg-muted rounded-lg p-1">
                <ModeButton label="Lifecycle" icon={Workflow} active={state.mode === 'LIFECYCLE'} onClick={() => dispatch({type: 'SET_MODE', payload: 'LIFECYCLE'})} />
                <ModeButton label="Context Switch" icon={Cpu} active={state.mode === 'CONTEXT_SWITCH'} onClick={() => dispatch({type: 'SET_MODE', payload: 'CONTEXT_SWITCH'})} />
            </div>
          </Card>

          {state.mode === 'LIFECYCLE' && (
            <>
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Gauge className="text-purple-500" size={20} />
                  Configuration
                </h2>
                <div className="space-y-4">
                  <ConfigInput label="Number of Processes" value={config.numProcesses} onChange={v => setConfig(c => ({...c, numProcesses: v}))} min={1}/>
                  <ConfigInput label="Avg Burst Time (ticks)" value={config.avgBurstTime} onChange={v => setConfig(c => ({...c, avgBurstTime: v}))} min={1}/>
                  <ConfigInput label="Arrival Interval (ticks)" value={config.arrivalInterval} onChange={v => setConfig(c => ({...c, arrivalInterval: v}))} min={1}/>
                  <ConfigInput label="Context Switch (ticks)" value={config.contextSwitchTime} onChange={v => setConfig(c => ({...c, contextSwitchTime: v}))} min={0}/>
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="text-fuchsia-500" size={20} />
                  Controls
                </h2>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => dispatch({type: state.lifecycle.isSimulationRunning ? 'LIFECYCLE_PAUSE' : 'LIFECYCLE_START'})} className="bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg px-4 py-2 uppercase font-bold text-sm flex items-center justify-center gap-2">
                      {state.lifecycle.isSimulationRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                    </button>
                    <button onClick={() => dispatch({type: 'LIFECYCLE_STEP'})} disabled={state.lifecycle.isSimulationRunning} className="bg-background text-text-primary shadow-card hover:text-accent active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <SkipForward size={16} /> Step
                    </button>
                    <button onClick={handleReset} className="bg-background text-text-primary shadow-card hover:text-accent active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2">
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button onClick={handleAddProcess} className="bg-background text-green-500 shadow-card hover:text-green-400 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Process
                    </button>
                    <button onClick={() => setIsSaveModalOpen(true)} className="col-span-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2" title="Save current state to database">
                        <Save size={16} /> Save Simulation
                    </button>
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-violet-500" size={20} />
                  Metrics
                </h2>
                <div className="grid grid-cols-2 gap-3 text-center">
                    <MetricBox label="Time" value={state.lifecycle.time} unit=" ticks" precision={0} color="violet"/>
                    <MetricBox label="CPU Utilization" value={calculatedMetrics.cpuUtilization} unit="%" precision={1} color="purple"/>
                    <MetricBox label="Avg. Waiting" value={calculatedMetrics.averageWaitingTime} unit=" t" precision={2} color="fuchsia"/>
                    <MetricBox label="Avg. Turnaround" value={calculatedMetrics.averageTurnaroundTime} unit=" t" precision={2} color="pink"/>
                    <MetricBox label="Context Switches" value={calculatedMetrics.contextSwitches} unit="" precision={0} color="indigo"/>
                </div>
              </Card>
            </>
          )}
        </aside>
        
        {/* Main Content */}
        <main className="space-y-6">
            {state.mode === 'LIFECYCLE' && (
              <>
                <LifecycleDiagram state={state.lifecycle} onSelectProcess={setSelectedProcess} />
                <ProcessTable processes={state.lifecycle.processes} onSelectProcess={setSelectedProcess} />
              </>
            )}
            {state.mode === 'CONTEXT_SWITCH' && <ContextSwitchView />}
        </main>
      </div>
      
      {selectedProcess && <ProcessPCBModal process={selectedProcess} onClose={() => setSelectedProcess(null)} />}

      <SaveSimulationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        algorithmType="process-management"
        simulationState={{
          mode: state.mode,
          config,
          lifecycle: Object.fromEntries(
              Object.entries(state.lifecycle).filter(([k]) => !['lastTransition', 'isSimulationRunning', 'runningProcessId', 'nextProcessToRun'].includes(k)) // clean up non-JSON friendly stuff if needed, though they shouldn't be much of an issue
          )
        }}
        defaultName={`Process Simulation - ${state.mode}`}
      />

      <QuizModal 
          isOpen={isQuizOpen} 
          onClose={() => setIsQuizOpen(false)} 
          moduleId="process-management" 
      />

      </div>
  );
};


// --- VISUALIZATION COMPONENTS ---

// SVG coordinate system: 800 x 420
// State node centres (cx, cy):
//   NEW      (100, 210)
//   READY    (340, 100)
//   RUNNING  (560, 210)
//   WAITING  (340, 320)
//   TERMINATED (720, 210)
const SV_W = 800;
const SV_H = 420;

const STATE_CX: Record<ProcessState, number> = {
  NEW: 100, READY: 340, RUNNING: 560, WAITING: 340, TERMINATED: 720,
};
const STATE_CY: Record<ProcessState, number> = {
  NEW: 210, READY: 100, RUNNING: 210, WAITING: 330, TERMINATED: 210,
};

const STATE_FILL: Record<ProcessState, string> = {
  NEW:        '#3b82f6',
  READY:      '#10b981',
  RUNNING:    '#f97316',
  WAITING:    '#eab308',
  TERMINATED: '#ef4444',
};

interface TransitionDef {
  key: string;
  from: ProcessState;
  to: ProcessState;
  d: string;
  label: string;
  labelX: number;
  labelY: number;
}

const TRANSITIONS: TransitionDef[] = [
  {
    key: 'NEW-READY',
    from: 'NEW', to: 'READY',
    d: 'M 140 195 Q 220 100 298 100',
    label: 'Admit',
    labelX: 210, labelY: 126,
  },
  {
    key: 'READY-RUNNING',
    from: 'READY', to: 'RUNNING',
    d: 'M 382 100 Q 470 100 518 190',
    label: 'Dispatch',
    labelX: 468, labelY: 116,
  },
  {
    key: 'RUNNING-READY',
    from: 'RUNNING', to: 'READY',
    d: 'M 518 225 Q 470 160 382 122',
    label: 'Interrupt',
    labelX: 468, labelY: 162,
  },
  {
    key: 'RUNNING-WAITING',
    from: 'RUNNING', to: 'WAITING',
    d: 'M 540 248 Q 480 310 382 318',
    label: 'I/O Wait',
    labelX: 476, labelY: 308,
  },
  {
    key: 'WAITING-READY',
    from: 'WAITING', to: 'READY',
    d: 'M 298 318 Q 240 300 248 178 Q 252 128 298 118',
    label: 'I/O Done',
    labelX: 222, labelY: 226,
  },
  {
    key: 'RUNNING-TERMINATED',
    from: 'RUNNING', to: 'TERMINATED',
    d: 'M 602 210 H 678',
    label: 'Exit',
    labelX: 640, labelY: 200,
  },
];

const LifecycleDiagram: React.FC<{state: State['lifecycle'], onSelectProcess: (p: SimulatedProcess) => void}> = ({ state, onSelectProcess }) => {
    const [activeTransition, setActiveTransition] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ p: SimulatedProcess; cx: number; cy: number } | null>(null);

    useEffect(() => {
        if (state.lastTransition) {
            const key = `${state.lastTransition.from}-${state.lastTransition.to}`;
            setActiveTransition(key);
            const timer = setTimeout(() => setActiveTransition(null), 600);
            return () => clearTimeout(timer);
        }
    }, [state.lastTransition]);

    const stateCounts = useMemo(() => {
        return state.processes.reduce((acc, p) => {
            acc[p.state] = (acc[p.state] || 0) + 1;
            return acc;
        }, {} as Record<ProcessState, number>);
    }, [state.processes]);

    const isSwitching = state.contextSwitchCountdown > 0;

    // Place process dots around the state centre in a small orbit
    const processDots = useMemo(() => {
        const counters: Record<string, number> = {};
        return state.processes.map(p => {
            if (p.state === 'TERMINATED') {
                const terminatedList = state.processes
                    .filter(pr => pr.state === 'TERMINATED')
                    .sort((a, b) => (a.completionTime || 0) - (b.completionTime || 0));
                const ti = terminatedList.findIndex(pr => pr.id === p.id);
                const col = ti % 3;
                const row = Math.floor(ti / 3);
                return {
                    p,
                    cx: STATE_CX['TERMINATED'] + (col - 1) * 22,
                    cy: STATE_CY['TERMINATED'] + 44 + row * 22,
                };
            }
            const key = p.state;
            const idx = counters[key] ?? 0;
            counters[key] = idx + 1;
            const total = stateCounts[p.state] || 1;
            const radius = p.state === 'RUNNING' ? 0 : Math.min(36 + total * 6, 56);
            const angle = (idx / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
            return {
                p,
                cx: STATE_CX[p.state] + Math.cos(angle) * radius,
                cy: STATE_CY[p.state] + Math.sin(angle) * radius,
            };
        });
    }, [state.processes, stateCounts]);

    return (
        <Card className="p-4 bg-panel border-white/40 dark:border-white/10 shadow-card shadow-lg rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-glow flex-shrink-0"></div>
                Process State Diagram
              </h2>
              <span className="text-sm font-mono bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-lg font-semibold flex-shrink-0 relative z-10 mr-8">
                Time: {state.time}
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${SV_W} ${SV_H}`}
                className="w-full"
                style={{ minWidth: 480, maxHeight: 420 }}
                preserveAspectRatio="xMidYMid meet"
                onClick={() => setTooltip(null)}
              >
                <defs>
                  <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
                  </marker>
                  <marker id="arr-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
                  </marker>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Region boxes */}
                {/* Ready region */}
                <rect x={260} y={52} width={160} height={100} rx={12}
                  fill="none" stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.35} />
                <text x={340} y={46} textAnchor="middle" fontSize={11} fontWeight={600} fill="#10b981" opacity={0.8}>Ready Queue</text>

                {/* Waiting region */}
                <rect x={260} y={272} width={160} height={100} rx={12}
                  fill="none" stroke="#eab308" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.35} />
                <text x={340} y={268} textAnchor="middle" fontSize={11} fontWeight={600} fill="#ca8a04" opacity={0.8}>I/O Wait Queue</text>

                {/* Running region */}
                <rect
                  x={504} y={162} width={112} height={96} rx={12}
                  fill={isSwitching ? 'rgba(139,92,246,0.10)' : 'none'}
                  stroke={isSwitching ? '#8b5cf6' : '#f97316'}
                  strokeWidth={1.5} strokeDasharray="6 4"
                  opacity={isSwitching ? 1 : 0.35}
                />
                {isSwitching && (
                  <text x={560} y={268} textAnchor="middle" fontSize={10} fontWeight={700} fill="#8b5cf6" opacity={0.9}>
                    Switching
                  </text>
                )}

                {/* Terminated region */}
                <rect x={664} y={162} width={112} height={96} rx={12}
                  fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.25} />

                {/* Transition arrows */}
                {TRANSITIONS.map(t => {
                  const isActive = activeTransition === t.key;
                  return (
                    <g key={t.key}>
                      <path
                        d={t.d}
                        fill="none"
                        stroke={isActive ? '#6366f1' : '#9ca3af'}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        markerEnd={`url(#${isActive ? 'arr-active' : 'arr'})`}
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                        filter={isActive ? 'url(#glow)' : undefined}
                      />
                      <text
                        x={t.labelX}
                        y={t.labelY}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={600}
                        fill={isActive ? '#6366f1' : '#9ca3af'}
                        style={{ transition: 'fill 0.2s', userSelect: 'none' }}
                      >
                        {t.label}
                      </text>
                    </g>
                  );
                })}

                {/* State node circles */}
                {(Object.keys(STATE_CX) as ProcessState[]).map(s => {
                  const cx = STATE_CX[s];
                  const cy = STATE_CY[s];
                  const count = stateCounts[s] || 0;
                  return (
                    <g key={s}>
                      <circle cx={cx} cy={cy} r={30} fill={STATE_FILL[s]} opacity={0.2} />
                      <circle cx={cx} cy={cy} r={30} fill="none" stroke={STATE_FILL[s]} strokeWidth={2} />
                      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={11} fontWeight={700} fill={STATE_FILL[s]} style={{ userSelect: 'none' }}>
                        {s}
                      </text>
                      {/* Count badge */}
                      <circle cx={cx + 22} cy={cy - 22} r={10} fill="#6366f1" />
                      <text x={cx + 22} y={cy - 18} textAnchor="middle" fontSize={10} fontWeight={700} fill="white" style={{ userSelect: 'none' }}>
                        {count}
                      </text>
                    </g>
                  );
                })}

                {/* Process dots */}
                {processDots.map(({ p, cx, cy }) => (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); setTooltip({ p, cx, cy }); onSelectProcess(p); }}
                  >
                    <circle
                      cx={cx} cy={cy} r={11}
                      fill={p.color}
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth={1.5}
                      opacity={p.state === 'TERMINATED' ? 0.6 : 1}
                    />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="white" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                      {p.name.length > 3 ? p.name.slice(0, 3) : p.name}
                    </text>
                  </g>
                ))}

                {/* Tooltip */}
                {tooltip && (() => {
                  const p = tooltip.p;
                  const tx = Math.min(tooltip.cx + 12, SV_W - 130);
                  const ty = Math.max(tooltip.cy - 70, 4);
                  return (
                    <g>
                      <rect x={tx} y={ty} width={120} height={72} rx={6} fill="#111827" opacity={0.95} />
                      <text x={tx + 8} y={ty + 16} fontSize={11} fontWeight={700} fill="white">{p.name}</text>
                      <text x={tx + 8} y={ty + 30} fontSize={10} fill="#d1d5db">State: {p.state}</text>
                      <text x={tx + 8} y={ty + 44} fontSize={10} fill="#d1d5db">Burst: {p.remainingBurstTime}/{p.totalBurstTime}</text>
                      <text x={tx + 8} y={ty + 58} fontSize={10} fill="#d1d5db">Wait: {p.waitingTime} ticks</text>
                    </g>
                  );
                })()}
              </svg>
            </div>
        </Card>
    );
};

const ProcessTable: React.FC<{processes: SimulatedProcess[], onSelectProcess: (p: SimulatedProcess) => void}> = ({ processes, onSelectProcess }) => {
    return (
        <Card className="p-4 w-full bg-panel border-white/40 dark:border-white/10 shadow-card shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-purple-500" size={20} />
              Process Table
            </h2>
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-panel z-10">
                  <tr>
                    <th className="p-2 font-medium">PID</th><th className="p-2 font-medium">State</th>
                    <th className="p-2 font-medium">Burst</th><th className="p-2 font-medium">Wait</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map(p => (
                    <tr key={p.id} className="border-t border-white/40 dark:border-white/10 hover:bg-muted/50 cursor-pointer" onClick={() => onSelectProcess(p)}>
                      <td className="p-2 font-semibold flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: p.color}}></div>{p.name}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full text-white ${stateColors[p.state]}`}>{p.state}</span></td>
                      <td className="p-2">{p.remainingBurstTime}/{p.totalBurstTime}</td>
                      <td className="p-2">{p.waitingTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </Card>
    );
};

const ContextSwitchView = () => {
    const p1 = { pc: '0x03A0', r1: 102, r2: 450 };
    const p2 = { pc: '0x1E4F', r1: 88, r2: 231 };
    const [activePcb, setActivePcb] = useState(1);
    const [cpu, setCpu] = useState(p1);
    const [isSwitching, setSwitching] = useState(false);

    const handleSwitch = () => {
        setSwitching(true);
        setTimeout(() => {
            const nextPcb = activePcb === 1 ? 2 : 1;
            setCpu(activePcb === 1 ? p2 : p1);
            setActivePcb(nextPcb);
            setSwitching(false);
        }, 1500);
    };

    return (
        <Card className="p-4 sm:p-6 bg-panel border-white/40 dark:border-white/10 shadow-card">
          <h2 className="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2">
            <Cpu className="text-violet-500" size={22} />
            Context Switch Visualization
          </h2>
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row justify-around w-full gap-4 sm:gap-0">
                <PCB pcbId={1} data={p1} isActive={activePcb === 1} isSaving={isSwitching && activePcb === 1} isLoading={isSwitching && activePcb === 2} />
                <PCB pcbId={2} data={p2} isActive={activePcb === 2} isSaving={isSwitching && activePcb === 2} isLoading={isSwitching && activePcb === 1} />
            </div>
            <div className={`text-text-primary drop-shadow-[0_1px_1px_#ffffff] font-semibold transition-transform duration-500 ${isSwitching ? 'scale-y-0' : 'scale-y-100'}`}>
              ▼ Save State / Load State ▲
            </div>
            <CPUDisplay data={cpu} isSwitching={isSwitching} />
            <button onClick={handleSwitch} disabled={isSwitching} className="bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg px-4 py-2 uppercase font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl">
                {isSwitching ? '⚡ Switching...' : `Switch to P${activePcb === 1 ? 2 : 1}`}
            </button>
          </div>
        </Card>
    );
};

// --- UI HELPER COMPONENTS ---

const ModeButton: React.FC<{label: string, icon: React.ElementType, active: boolean, onClick: () => void}> = ({label, icon: Icon, active, onClick}) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-md transition-all duration-300 ${active ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-md scale-105' : 'text-text-muted hover:bg-muted/80'}`}>
        <Icon size={16} /> <span className="hidden md:inline">{label}</span>
    </button>
);

const ConfigInput: React.FC<{label: string, value: number, onChange: (val: number) => void, min: number}> = ({label, value, onChange, min}) => (
    <div>
        <label className="text-sm font-medium text-text-muted">{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} className="w-full p-2 mt-1 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all duration-300" />
    </div>
);

const MetricBox: React.FC<{label: string, value: number, unit: string, precision: number, color: string}> = ({label, value, unit, precision, color}) => {
    const gradientMap: Record<string, string> = {
        violet: 'bg-background shadow-recessed border-border-light text-text-primary',
        purple: 'bg-background shadow-recessed border-border-light text-text-primary',
        fuchsia: 'bg-background shadow-recessed border-border-light text-text-primary',
        pink: 'bg-background shadow-recessed border-border-light text-text-primary',
        indigo: 'bg-background shadow-recessed border-border-light text-text-primary',
    };
    
    return (
        <div className={`p-3 bg-gradient-to-br ${gradientMap[color]} border rounded-lg transition-all duration-300 hover:scale-105`}>
            <p className="text-xs font-medium mb-1">{label}</p>
            <div className="text-lg sm:text-xl font-bold">
                <AnimatedNumber value={value} precision={precision} />
                <span className="text-sm font-medium">{unit}</span>
            </div>
        </div>
    );
};

const PCB: React.FC<{pcbId: number, data: any, isActive: boolean, isSaving: boolean, isLoading: boolean}> = ({pcbId, data, isActive, isSaving, isLoading}) => (
    <div className={`p-4 sm:p-5 border-2 rounded-lg w-full sm:w-48 transition-all duration-500 ${
        isActive 
            ? 'border-violet-500 shadow-lg shadow-violet-500/30 bg-panel shadow-recessed' 
            : 'border-white/40 dark:border-white/10 bg-background/50'
    }`}>
        <h3 className="font-bold text-center text-base sm:text-lg mb-2 text-text-primary drop-shadow-[0_1px_1px_#ffffff]">
          PCB: P{pcbId}
        </h3>
        <div className="mt-3 space-y-2 text-sm font-mono">
            <p className="flex justify-between">
              <span className="text-text-muted">PC:</span> 
              <span className={`font-semibold ${isSaving ? 'animate-pulse text-text-primary' : ''}`}>{data.pc}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-text-muted">R1:</span> 
              <span className={`font-semibold ${isSaving ? 'animate-pulse text-text-primary' : ''}`}>{data.r1}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-text-muted">R2:</span> 
              <span className={`font-semibold ${isSaving ? 'animate-pulse text-text-primary' : ''}`}>{data.r2}</span>
            </p>
        </div>
        {isLoading && <div className="text-xs text-center mt-3 text-text-primary drop-shadow-[0_1px_1px_#ffffff] font-semibold animate-pulse">Loading...</div>}
    </div>
);

const CPUDisplay: React.FC<{data: any, isSwitching: boolean}> = ({data, isSwitching}) => (
    <div className="p-6 border-4 border-violet-500 rounded-lg bg-panel shadow-recessed w-full sm:w-72 text-center relative shadow-lg transition-all duration-300">
        <h3 className="font-bold text-xl mb-4 flex items-center justify-center gap-2 text-text-primary drop-shadow-[0_1px_1px_#ffffff]">
          <Cpu size={24} className="text-violet-500"/> CPU
        </h3>
        <div className="space-y-3 font-mono text-base">
            <p className="flex justify-between px-4">
              <span className="text-text-muted">PC:</span> 
              <span className="font-semibold">{data.pc}</span>
            </p>
            <p className="flex justify-between px-4">
              <span className="text-text-muted">R1:</span> 
              <span className="font-semibold">{data.r1}</span>
            </p>
            <p className="flex justify-between px-4">
              <span className="text-text-muted">R2:</span> 
              <span className="font-semibold">{data.r2}</span>
            </p>
        </div>
        {isSwitching && (
          <div className="absolute inset-0 bg-panel shadow-recessed rounded-lg flex items-center justify-center">
            <div className="text-white font-bold text-lg uppercase tracking-wider animate-pulse flex items-center gap-2">
              <Zap size={20} className="animate-bounce" />
              SCHEDULER
              <Zap size={20} className="animate-bounce" />
            </div>
          </div>
        )}
    </div>
);

export default ProcessManagementPage;