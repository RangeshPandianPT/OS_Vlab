import React, { useState, useEffect, useCallback, useReducer, useMemo, useRef } from 'react';
import type { SimulatedProcess, ProcessState, ProcessSimulationMode } from '../types';
import Card from '../components/Card';
import AnimatedNumber from '../components/AnimatedNumber';
import ProcessPCBModal from '../components/ProcessPCBModal';
import { Play, Pause, RotateCcw, Plus, SkipForward, Cpu, Workflow } from 'lucide-react';

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Process Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        
        {/* Left Panel: Configuration and Metrics */}
        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Simulation Mode</h2>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <ModeButton label="Lifecycle" icon={Workflow} active={state.mode === 'LIFECYCLE'} onClick={() => dispatch({type: 'SET_MODE', payload: 'LIFECYCLE'})} />
                <ModeButton label="Context Switch" icon={Cpu} active={state.mode === 'CONTEXT_SWITCH'} onClick={() => dispatch({type: 'SET_MODE', payload: 'CONTEXT_SWITCH'})} />
            </div>
          </Card>

          {state.mode === 'LIFECYCLE' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                <div className="space-y-4">
                  <ConfigInput label="Number of Processes" value={config.numProcesses} onChange={v => setConfig(c => ({...c, numProcesses: v}))} min={1}/>
                  <ConfigInput label="Avg Burst Time (ticks)" value={config.avgBurstTime} onChange={v => setConfig(c => ({...c, avgBurstTime: v}))} min={1}/>
                  <ConfigInput label="Arrival Interval (ticks)" value={config.arrivalInterval} onChange={v => setConfig(c => ({...c, arrivalInterval: v}))} min={1}/>
                  <ConfigInput label="Context Switch (ticks)" value={config.contextSwitchTime} onChange={v => setConfig(c => ({...c, contextSwitchTime: v}))} min={0}/>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Controls</h2>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => dispatch({type: state.lifecycle.isSimulationRunning ? 'LIFECYCLE_PAUSE' : 'LIFECYCLE_START'})} className="btn-primary">
                      {state.lifecycle.isSimulationRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                    </button>
                    <button onClick={() => dispatch({type: 'LIFECYCLE_STEP'})} disabled={state.lifecycle.isSimulationRunning} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                        <SkipForward size={16} /> Step
                    </button>
                    <button onClick={handleReset} className="btn-secondary">
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button onClick={handleAddProcess} className="btn-success">
                        <Plus size={16} /> Add Process
                    </button>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Metrics</h2>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <MetricBox label="Time" value={state.lifecycle.time} unit=" ticks" precision={0}/>
                    <MetricBox label="CPU Utilization" value={calculatedMetrics.cpuUtilization} unit="%" precision={1}/>
                    <MetricBox label="Avg. Waiting" value={calculatedMetrics.averageWaitingTime} unit=" t" precision={2}/>
                    <MetricBox label="Avg. Turnaround" value={calculatedMetrics.averageTurnaroundTime} unit=" t" precision={2}/>
                    <MetricBox label="Context Switches" value={calculatedMetrics.contextSwitches} unit="" precision={0}/>
                </div>
              </Card>
            </>
          )}
           {state.mode === 'CONTEXT_SWITCH' && (
             <Card className="p-6">
                 <h2 className="text-lg font-semibold mb-4">Context Switch</h2>
                 <p className="text-sm text-text-muted-light dark:text-text-muted-dark">This visualization demonstrates the process of a context switch. When the OS decides to run a different process, it must save the state of the current process (like the Program Counter and register values) into its Process Control Block (PCB) and load the state for the new process from its PCB.</p>
             </Card>
           )}
        </aside>
        
        {/* Main Content */}
        <main className="space-y-6">
            {state.mode === 'LIFECYCLE' && (
              <>
                <LifecycleDiagram state={state.lifecycle} onSelectProcess={setSelectedProcess} />
                <ProcessTable processes={state.lifecycle.processes} onSelectProcess={setSelectedProcess} />
                <Card className="p-6 animate-fade-in">
                  <h2 className="text-lg font-semibold mb-3">How It Works: SRTF Scheduling</h2>
                  <div className="text-text-muted-light dark:text-text-muted-dark text-sm space-y-2">
                      <p>This simulation visualizes the <strong className="font-semibold text-accent">Shortest Remaining Time First (SRTF)</strong> scheduling algorithm, a preemptive version of Shortest Job First.</p>
                      <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Processes move from <strong>New</strong> to the <strong>Ready</strong> queue upon arrival.</li>
                        <li>The OS scheduler always selects the process from the Ready queue with the smallest remaining burst time to run on the CPU.</li>
                        <li>If a new process arrives with a burst time shorter than the currently <strong className="font-semibold text-green-400">running</strong> process's remaining time, the running process is <strong>preempted</strong> (interrupted) and moved back to the Ready queue.</li>
                        <li>A <strong className="font-semibold text-orange-400">Context Switch</strong> (shown by the pulsing CPU and 'SCHEDULER' animation) introduces a small delay, simulating the overhead of saving and loading process states.</li>
                        <li>Processes can enter a <strong className="font-semibold text-yellow-400">Waiting</strong> state for I/O, freeing the CPU. They return to the Ready queue when I/O is complete.</li>
                      </ul>
                  </div>
                </Card>
              </>
            )}
            {state.mode === 'CONTEXT_SWITCH' && <ContextSwitchView />}
        </main>
      </div>
      
      {selectedProcess && <ProcessPCBModal process={selectedProcess} onClose={() => setSelectedProcess(null)} />}

      <style>{`
        .btn-primary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-colors; }
        .btn-secondary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors; }
        .btn-success { @apply flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors; }
        .transition-arrow {
            stroke: #d1d5db; /* gray-300 */
            transition: all 0.2s ease-in-out;
        }
        .dark .transition-arrow {
            stroke: #4b5563; /* gray-600 */
        }
        .transition-arrow.active {
            stroke: #3b82f6; /* accent */
            stroke-width: 2.5;
        }
        .transition-label {
            fill: #6b7280; /* gray-500 */
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            opacity: 0.7;
        }
        .dark .transition-label {
            fill: #9ca3af; /* gray-400 */
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  );
};


// --- VISUALIZATION COMPONENTS ---

const LifecycleDiagram: React.FC<{state: State['lifecycle'], onSelectProcess: (p: SimulatedProcess) => void}> = ({ state, onSelectProcess }) => {
    const statePositions: Record<ProcessState, { top: string; left: string }> = useMemo(() => ({
        NEW: { top: '50%', left: '20%' },
        READY: { top: '25%', left: '50%' },
        RUNNING: { top: '50%', left: '75%' },
        WAITING: { top: '75%', left: '50%' },
        TERMINATED: { top: '50%', left: '95%' },
    }), []);
    
    const [activeTransition, setActiveTransition] = useState<string | null>(null);

    useEffect(() => {
        if (state.lastTransition) {
            const key = `${state.lastTransition.from}-${state.lastTransition.to}`;
            setActiveTransition(key);
            const timer = setTimeout(() => setActiveTransition(null), 500); // Highlight for 500ms
            return () => clearTimeout(timer);
        }
    }, [state.lastTransition]);

    const transitions = useMemo(() => [
        { key: 'NEW-READY', from: 'NEW', to: 'READY', path: 'M 260 300 Q 430 225 580 150', label: 'Admit', textOffset: '50%' },
        { key: 'READY-RUNNING', from: 'READY', to: 'RUNNING', path: 'M 620 150 Q 750 225 880 300', label: 'Dispatch', textOffset: '50%' },
        { key: 'RUNNING-READY', from: 'RUNNING', to: 'READY', path: 'M 880 300 Q 750 100 620 150', label: 'Interrupt', textOffset: '50%' },
        { key: 'RUNNING-WAITING', from: 'RUNNING', to: 'WAITING', path: 'M 880 300 Q 750 375 620 450', label: 'I/O Wait', textOffset: '50%' },
        { key: 'WAITING-READY', from: 'WAITING', to: 'READY', path: 'M 580 450 Q 430 300 580 150', label: 'I/O Complete', textOffset: '50%' },
        { key: 'RUNNING-TERMINATED', from: 'RUNNING', to: 'TERMINATED', path: 'M 930 300 H 1120', label: 'Exit', textOffset: '50%' },
    ], []);

    const stateCounts = useMemo(() => {
        return state.processes.reduce((acc, p) => {
            acc[p.state] = (acc[p.state] || 0) + 1;
            return acc;
        }, {} as Record<ProcessState, number>);
    }, [state.processes]);

    const isSwitching = state.contextSwitchCountdown > 0;

    return (
        <Card className="p-4 relative w-full h-[520px] bg-slate-800/60 shadow rounded-lg">
            <h2 className="text-lg font-semibold">Process State Diagram</h2>
            <div className="absolute top-4 right-4 text-lg font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg z-20"> Time: {state.time} </div>

            <div className="absolute inset-0 pt-12 flex items-center justify-center">
              <div className="relative w-full h-full">
                <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[45%] h-[50%] border-2 border-dashed border-green-500/30 rounded-2xl" style={statePositions['READY'] as any}>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bkg-light dark:bg-bkg-dark px-2 text-sm font-semibold text-green-600 dark:text-green-400">Ready Queue</span>
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[45%] h-[50%] border-2 border-dashed border-yellow-500/30 rounded-2xl" style={statePositions['WAITING'] as any}>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bkg-light dark:bg-bkg-dark px-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">I/O Wait Queue</span>
                </div>
                <div 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-[18%] h-[20%] border-2 border-dashed rounded-2xl transition-all duration-300 flex items-center justify-center ${
                        isSwitching 
                            ? 'border-accent shadow-lg shadow-accent/50 animate-pulse' 
                            : 'border-blue-500/30'
                    }`} 
                    style={statePositions['RUNNING'] as any}
                >
                    {isSwitching && (
                        <div className="text-accent font-bold text-xs uppercase tracking-wider">
                            Switching
                        </div>
                    )}
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[18%] h-[30%] border-2 border-dashed border-gray-500/30 rounded-2xl" style={statePositions['TERMINATED'] as any}></div>
                
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="4.5" refY="1.75" orient="auto">
                            <polygon points="0 0, 5 1.75, 0 3.5" className="fill-current text-gray-400 dark:text-gray-600 transition-colors" />
                        </marker>
                        <marker id="arrowhead-active" markerWidth="5" markerHeight="3.5" refX="4.5" refY="1.75" orient="auto">
                            <polygon points="0 0, 5 1.75, 0 3.5" className="fill-current text-accent transition-colors" />
                        </marker>
                    </defs>
                    {transitions.map(t => {
                        const isActive = activeTransition === t.key;
                        return (
                            <g key={t.key}>
                                <path id={`path-${t.key}`} d={t.path} strokeWidth="1.5" markerEnd={`url(#${isActive ? 'arrowhead-active' : 'arrowhead'})`} className={`transition-arrow ${isActive ? 'active' : ''}`} />
                                <text dy="-8" className="transition-label">
                                    <textPath href={`#path-${t.key}`} startOffset={t.textOffset} textAnchor="middle">{t.label}</textPath>
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {Object.entries(statePositions).map(([s, pos]) => (
                <div key={s} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={pos as any}>
                    <div className="relative px-3 py-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark shadow-sm">
                    <p className="font-semibold text-sm capitalize">{s.toLowerCase()}</p>
                    <span className="absolute -top-2 -right-2 text-xs font-bold bg-accent text-white rounded-full h-5 w-5 flex items-center justify-center">{stateCounts[s as ProcessState] || 0}</span>
                    </div>
                </div>
                ))}

                {state.processes.map((p, index) => {
                    const isTerminated = p.state === 'TERMINATED';
                    
                    let style: React.CSSProperties = { backgroundColor: p.color, zIndex: 10 };
                    let className = "group absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg cursor-pointer transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-lg hover:shadow-accent/50";

                    if (isTerminated) {
                      const terminatedList = state.processes.filter(pr => pr.state === 'TERMINATED' && pr.completionTime != null).sort((a,b)=> (a.completionTime||0)-(b.completionTime||0));
                      const terminatedIndex = terminatedList.findIndex(pr => pr.id === p.id);
                      if (terminatedIndex !== -1) {
                        const maxPerRow = 3;
                        const row = Math.floor(terminatedIndex / maxPerRow);
                        const col = terminatedIndex % maxPerRow;
                        style.left = `calc(${statePositions['TERMINATED'].left} + ${col * 40 - 20}px)`;
                        style.top = `calc(${statePositions['TERMINATED'].top} + ${row * 40 + 40}px)`;
                        style.transform = `translate(-50%, -50%)`;
                        style.opacity = 0.9;
                      }
                    } else {
                        const statePos = statePositions[p.state];
                        const countInState = Math.max(1, stateCounts[p.state] || 1);
                        const angle = (index / Math.max(1, state.processes.length)) * 2 * Math.PI + (state.time * 0.02);
                        const offsetRadiusMap: Record<ProcessState, number> = {
                            NEW: 50, READY: 80, RUNNING: 0, WAITING: 80, TERMINATED: 0,
                        };
                        const offsetRadius = offsetRadiusMap[p.state] + Math.min(countInState, 10) * 8;
                        const xOffset = Math.cos(angle) * offsetRadius;
                        const yOffset = Math.sin(angle) * offsetRadius;
                        style.top = `calc(${statePos.top} + ${yOffset}px)`;
                        style.left = `calc(${statePos.left} + ${xOffset}px)`;
                        style.transform = 'translate(-50%, -50%)';
                    }

                    if (p.state === 'WAITING') className += ' animate-pulse';

                    return (
                        <div key={p.id} className={className} style={style} onClick={() => onSelectProcess(p)}>
                        {p.name}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 text-left leading-relaxed">
                                <strong>Process: {p.name}</strong><br/>
                                State: {p.state}<br/>
                                Burst: {p.remainingBurstTime}/{p.totalBurstTime}<br/>
                                Wait Time: {p.waitingTime} ticks
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>
        </Card>
    );
};

const ProcessTable: React.FC<{processes: SimulatedProcess[], onSelectProcess: (p: SimulatedProcess) => void}> = ({ processes, onSelectProcess }) => {
    return (
        <Card className="p-4 w-full bg-slate-800/60 shadow rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Process Table</h2>
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-card-light dark:bg-card-dark z-10">
                  <tr>
                    <th className="p-2 font-medium">PID</th><th className="p-2 font-medium">State</th>
                    <th className="p-2 font-medium">Burst</th><th className="p-2 font-medium">Wait</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map(p => (
                    <tr key={p.id} className="border-t border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => onSelectProcess(p)}>
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
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Context Switch Visualization</h2>
          <div className="flex flex-col items-center gap-8">
            <div className="flex justify-around w-full">
                <PCB pcbId={1} data={p1} isActive={activePcb === 1} isSaving={isSwitching && activePcb === 1} isLoading={isSwitching && activePcb === 2} />
                <PCB pcbId={2} data={p2} isActive={activePcb === 2} isSaving={isSwitching && activePcb === 2} isLoading={isSwitching && activePcb === 1} />
            </div>
            <div className={`text-accent transition-transform duration-500 ${isSwitching ? 'scale-y-0' : 'scale-y-100'}`} >▼ Save State / Load State ▲</div>
            <CPUDisplay data={cpu} isSwitching={isSwitching} />
            <button onClick={handleSwitch} disabled={isSwitching} className="btn-primary disabled:opacity-50">
                {isSwitching ? 'Switching...' : `Switch to P${activePcb === 1 ? 2 : 1}`}
            </button>
          </div>
        </Card>
    );
};

// --- UI HELPER COMPONENTS ---

const ModeButton: React.FC<{label: string, icon: React.ElementType, active: boolean, onClick: () => void}> = ({label, icon: Icon, active, onClick}) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-md transition-colors ${active ? 'bg-white dark:bg-gray-900/80 text-accent shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
        <Icon size={16} /> <span className="hidden md:inline">{label}</span>
    </button>
);

const ConfigInput: React.FC<{label: string, value: number, onChange: (val: number) => void, min: number}> = ({label, value, onChange, min}) => (
    <div>
        <label className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none" />
    </div>
);

const MetricBox: React.FC<{label: string, value: number, unit: string, precision: number}> = ({label, value, unit, precision}) => (
    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{label}</p>
        <div className="text-xl font-bold">
            <AnimatedNumber value={value} precision={precision} />
            <span className="text-base font-medium">{unit}</span>
        </div>
    </div>
);

const PCB: React.FC<{pcbId: number, data: any, isActive: boolean, isSaving: boolean, isLoading: boolean}> = ({pcbId, data, isActive, isSaving, isLoading}) => (
    <div className={`p-4 border-2 rounded-lg w-48 transition-all duration-500 ${isActive ? 'border-accent shadow-lg' : 'border-border-light dark:border-border-dark'}`}>
        <h3 className="font-bold text-center">PCB: P{pcbId}</h3>
        <div className="mt-2 space-y-1 text-sm font-mono">
            <p>PC: <span className={isSaving ? 'animate-pulse' : ''}>{data.pc}</span></p>
            <p>R1: <span className={isSaving ? 'animate-pulse' : ''}>{data.r1}</span></p>
            <p>R2: <span className={isSaving ? 'animate-pulse' : ''}>{data.r2}</span></p>
        </div>
        {isLoading && <div className="text-xs text-center mt-2 text-accent animate-pulse">Loading...</div>}
    </div>
);

const CPUDisplay: React.FC<{data: any, isSwitching: boolean}> = ({data, isSwitching}) => (
    <div className="p-6 border-4 border-accent rounded-lg bg-accent/10 w-64 text-center relative">
        <h3 className="font-bold text-xl mb-2 flex items-center justify-center gap-2"><Cpu size={24}/> CPU</h3>
        <div className="space-y-2 font-mono">
            <p>PC: <span>{data.pc}</span></p>
            <p>R1: <span>{data.r1}</span></p>
            <p>R2: <span>{data.r2}</span></p>
        </div>
        {isSwitching && <div className="absolute inset-0 bg-bkg-light/80 dark:bg-bkg-dark/80 flex items-center justify-center font-semibold text-accent animate-pulse">SCHEDULER</div>}
    </div>
);

export default ProcessManagementPage;