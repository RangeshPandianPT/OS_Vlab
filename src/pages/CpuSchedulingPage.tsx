import React, { useState, useMemo } from 'react';
import type { Process, SchedulingAlgorithm, SimulationResult, GanttChartEntry } from '@/types';
import AlgorithmSelector from '@/components/simulation/AlgorithmSelector';
import SimulationControls from '@/components/simulation/SimulationControls';
import SimulationResults from '@/components/simulation/SimulationResults';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import SaveSimulationModal from '@/components/modals/SaveSimulationModal';
import Card from '@/components/shared/Card';
import { BookOpen, Save, GitCompare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import QuizModal from '@/components/modals/QuizModal';
import { usePermalinkState } from '@/hooks/usePermalinkState';
import type { ToastType } from '@/components/shared/Toast';

const defaultProcesses: Process[] = [
  { id: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
  { id: 2, name: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: 3, name: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
  { id: 4, name: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

type ProcState = Process & { remainingTime: number };

const buildResult = (
  ganttChart: GanttChartEntry[],
  processes: ProcState[],
  totalBurstTime: number
): SimulationResult => {
  const totalDuration = processes.reduce((m, p) => Math.max(m, p.completionTime ?? 0), 0);
  const totalWaiting = processes.reduce((s, p) => s + (p.waitingTime ?? 0), 0);
  const totalTAT = processes.reduce((s, p) => s + (p.turnaroundTime ?? 0), 0);
  const n = processes.length;
  return {
    ganttChart,
    processMetrics: [...processes].sort((a, b) => a.id - b.id),
    totalDuration,
    metrics: {
      averageWaitingTime: n > 0 ? totalWaiting / n : 0,
      averageTurnaroundTime: n > 0 ? totalTAT / n : 0,
      cpuUtilization: totalDuration > 0 ? (totalBurstTime / totalDuration) * 100 : 0,
    },
  };
};

// Append a 1-unit Gantt slice, merging with last entry if same process name
const pushGanttTick = (gantt: GanttChartEntry[], name: string, time: number) => {
  const last = gantt[gantt.length - 1];
  if (last && last.processName === name) { last.duration++; }
  else { gantt.push({ processName: name, start: time, duration: 1 }); }
};

// ─── FCFS ───────────────────────────────────────────────────────────────────
const runFCFS = (procs: Process[]): SimulationResult => {
  const ps: ProcState[] = [...procs]
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .map(p => ({ ...p, remainingTime: p.burstTime }));

  const ganttChart: GanttChartEntry[] = [];
  let t = 0;
  const totalBurst = ps.reduce((s, p) => s + p.burstTime, 0);

  for (const p of ps) {
    if (t < p.arrivalTime) t = p.arrivalTime;
    p.waitingTime = t - p.arrivalTime;
    p.completionTime = t + p.burstTime;
    p.turnaroundTime = p.completionTime - p.arrivalTime;
    ganttChart.push({ processName: p.name, start: t, duration: p.burstTime });
    t = p.completionTime;
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── SJF (Non-preemptive) ───────────────────────────────────────────────────
const runSJF = (procs: Process[]): SimulationResult => {
  const ps: ProcState[] = procs.map(p => ({ ...p, remainingTime: p.burstTime }));
  const ganttChart: GanttChartEntry[] = [];
  let t = 0;
  const done = new Set<number>();
  const totalBurst = ps.reduce((s, p) => s + p.burstTime, 0);

  while (done.size < ps.length) {
    const avail = ps.filter(p => p.arrivalTime <= t && !done.has(p.id));
    if (avail.length === 0) {
      const next = ps.filter(p => !done.has(p.id)).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (next) t = next.arrivalTime;
      continue;
    }
    // Shortest burst time, tie-break by arrival
    avail.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
    const sel = avail[0];
    sel.waitingTime = t - sel.arrivalTime;
    sel.completionTime = t + sel.burstTime;
    sel.turnaroundTime = sel.completionTime - sel.arrivalTime;
    ganttChart.push({ processName: sel.name, start: t, duration: sel.burstTime });
    t = sel.completionTime;
    done.add(sel.id);
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── SRTF (Preemptive SJF) ─────────────────────────────────────────────────
const runSRTF = (procs: Process[]): SimulationResult => {
  const ps: ProcState[] = procs.map(p => ({
    ...p, remainingTime: p.burstTime, waitingTime: 0, completionTime: 0, turnaroundTime: 0,
  }));
  const ganttChart: GanttChartEntry[] = [];
  const totalBurst = ps.reduce((s, p) => s + p.burstTime, 0);
  let t = 0, done = 0;

  while (done < ps.length) {
    const avail = ps.filter(p => p.arrivalTime <= t && p.remainingTime > 0);
    if (avail.length === 0) {
      const next = ps.filter(p => p.remainingTime > 0).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (!next) break;
      t = next.arrivalTime;
      continue;
    }
    avail.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);
    const sel = avail[0];
    pushGanttTick(ganttChart, sel.name, t);
    sel.remainingTime--;
    t++;
    if (sel.remainingTime === 0) {
      sel.completionTime = t;
      sel.turnaroundTime = t - sel.arrivalTime;
      sel.waitingTime = sel.turnaroundTime - sel.burstTime;
      done++;
    }
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── Round Robin ───────────────────────────────────────────────────────────
const runRR = (procs: Process[], quantum: number): SimulationResult => {
  const q = Math.max(1, quantum);
  const ps: ProcState[] = procs.map(p => ({
    ...p, remainingTime: p.burstTime, waitingTime: 0, completionTime: 0, turnaroundTime: 0,
  }));
  const sorted = [...ps].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const ganttChart: GanttChartEntry[] = [];
  const totalBurst = ps.reduce((s, p) => s + p.burstTime, 0);
  const queue: ProcState[] = [];
  let t = 0, ai = 0, done = 0;

  const enqueue = (time: number) => {
    while (ai < sorted.length && sorted[ai].arrivalTime <= time) queue.push(sorted[ai++]);
  };

  enqueue(0);

  while (done < ps.length) {
    if (queue.length === 0) {
      if (ai < sorted.length) { t = sorted[ai].arrivalTime; enqueue(t); }
      else break;
    }
    const cur = queue.shift()!;
    const exec = Math.min(q, cur.remainingTime);
    ganttChart.push({ processName: cur.name, start: t, duration: exec });
    t += exec;
    cur.remainingTime -= exec;
    enqueue(t);
    if (cur.remainingTime === 0) {
      cur.completionTime = t;
      cur.turnaroundTime = t - cur.arrivalTime;
      cur.waitingTime = cur.turnaroundTime - cur.burstTime;
      done++;
    } else {
      queue.push(cur);
    }
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── Priority Non-Preemptive ───────────────────────────────────────────────
// Lower priority number = higher priority (1 is most urgent)
const runPriorityNP = (procs: Process[]): SimulationResult => {
  const ps: ProcState[] = procs.map(p => ({ ...p, remainingTime: p.burstTime }));
  const ganttChart: GanttChartEntry[] = [];
  let t = 0;
  const done = new Set<number>();
  const totalBurst = ps.reduce((s, p) => s + p.burstTime, 0);

  while (done.size < ps.length) {
    const avail = ps.filter(p => p.arrivalTime <= t && !done.has(p.id));
    if (avail.length === 0) {
      const next = ps.filter(p => !done.has(p.id)).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (next) t = next.arrivalTime;
      continue;
    }
    avail.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.arrivalTime - b.arrivalTime);
    const sel = avail[0];
    sel.waitingTime = t - sel.arrivalTime;
    sel.completionTime = t + sel.burstTime;
    sel.turnaroundTime = sel.completionTime - sel.arrivalTime;
    ganttChart.push({ processName: sel.name, start: t, duration: sel.burstTime });
    t = sel.completionTime;
    done.add(sel.id);
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── Priority Preemptive ──────────────────────────────────────────────────
const runPriorityP = (procs: Process[]): SimulationResult => {
  const ps: ProcState[] = procs.map(p => ({
    ...p, remainingTime: p.burstTime, waitingTime: 0, completionTime: 0, turnaroundTime: 0,
  }));
  const ganttChart: GanttChartEntry[] = [];
  const totalBurst = ps.reduce((s, p) => s + p.burstTime, 0);
  let t = 0, done = 0;

  while (done < ps.length) {
    const avail = ps.filter(p => p.arrivalTime <= t && p.remainingTime > 0);
    if (avail.length === 0) {
      const next = ps.filter(p => p.remainingTime > 0).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (!next) break;
      t = next.arrivalTime;
      continue;
    }
    avail.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.arrivalTime - b.arrivalTime);
    const sel = avail[0];
    pushGanttTick(ganttChart, sel.name, t);
    sel.remainingTime--;
    t++;
    if (sel.remainingTime === 0) {
      sel.completionTime = t;
      sel.turnaroundTime = t - sel.arrivalTime;
      sel.waitingTime = sel.turnaroundTime - sel.burstTime;
      done++;
    }
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── MLQ (Multi-Level Queue) ───────────────────────────────────────────────
// Queue assignment (by priority field):
//   Q0 – System      (priority = 1)   → Round Robin (timeQuantum)
//   Q1 – Interactive (priority 2–3)   → FCFS within queue, full-run non-preemptive
//   Q2 – Batch       (priority ≥ 4)   → FCFS within queue, full-run non-preemptive
// Higher-numbered queues are only served when all higher-priority queues are empty
// at the next scheduling decision point.
const runMLQ = (procs: Process[], quantum: number): SimulationResult => {
  const q = Math.max(1, quantum);
  const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);

  const ps: (ProcState & { qLevel: number })[] = procs.map(p => ({
    ...p,
    remainingTime: p.burstTime,
    waitingTime: 0,
    completionTime: 0,
    turnaroundTime: 0,
    qLevel: (p.priority ?? 1) <= 1 ? 0 : (p.priority ?? 1) <= 3 ? 1 : 2,
  }));

  const sorted = [...ps].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const ganttChart: GanttChartEntry[] = [];
  const rrQueue: typeof ps = [];
  let t = 0, ai = 0, done = 0;

  const enqueue = (time: number) => {
    while (ai < sorted.length && sorted[ai].arrivalTime <= time) {
      if (sorted[ai].qLevel === 0) rrQueue.push(sorted[ai]);
      ai++;
    }
  };

  enqueue(0);

  while (done < ps.length) {
    enqueue(t);

    const q0 = rrQueue.filter(p => p.remainingTime > 0);
    const q1 = ps.filter(p => p.qLevel === 1 && p.arrivalTime <= t && p.remainingTime > 0)
                  .sort((a, b) => a.arrivalTime - b.arrivalTime);
    const q2 = ps.filter(p => p.qLevel === 2 && p.arrivalTime <= t && p.remainingTime > 0)
                  .sort((a, b) => a.arrivalTime - b.arrivalTime);

    if (q0.length > 0) {
      // Pop from rrQueue (maintains circular order)
      const cur = rrQueue.shift()!;
      if (cur.remainingTime <= 0) continue;
      const exec = Math.min(q, cur.remainingTime);
      ganttChart.push({ processName: cur.name, start: t, duration: exec });
      t += exec;
      cur.remainingTime -= exec;
      enqueue(t);
      if (cur.remainingTime === 0) {
        cur.completionTime = t;
        cur.turnaroundTime = t - cur.arrivalTime;
        cur.waitingTime = cur.turnaroundTime - cur.burstTime;
        done++;
      } else {
        rrQueue.push(cur);
      }
    } else if (q1.length > 0) {
      const sel = q1[0];
      ganttChart.push({ processName: sel.name, start: t, duration: sel.remainingTime });
      t += sel.remainingTime;
      sel.completionTime = t;
      sel.turnaroundTime = t - sel.arrivalTime;
      sel.waitingTime = sel.turnaroundTime - sel.burstTime;
      sel.remainingTime = 0;
      done++;
    } else if (q2.length > 0) {
      const sel = q2[0];
      ganttChart.push({ processName: sel.name, start: t, duration: sel.remainingTime });
      t += sel.remainingTime;
      sel.completionTime = t;
      sel.turnaroundTime = t - sel.arrivalTime;
      sel.waitingTime = sel.turnaroundTime - sel.burstTime;
      sel.remainingTime = 0;
      done++;
    } else {
      const next = ps.filter(p => p.remainingTime > 0).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (!next) break;
      t = next.arrivalTime;
      enqueue(t);
    }
  }
  return buildResult(ganttChart, ps, totalBurst);
};

// ─── Dispatcher ────────────────────────────────────────────────────────────
const runSimulationLogic = (
  procs: Process[],
  alg: SchedulingAlgorithm,
  tq: number
): SimulationResult => {
  if (procs.length === 0) {
    return { ganttChart: [], processMetrics: [], totalDuration: 0, metrics: { averageWaitingTime: 0, averageTurnaroundTime: 0, cpuUtilization: 0 } };
  }
  switch (alg) {
    case 'FCFS':        return runFCFS(procs);
    case 'SJF':         return runSJF(procs);
    case 'SRTF':        return runSRTF(procs);
    case 'RR':          return runRR(procs, tq);
    case 'PRIORITY_NP': return runPriorityNP(procs);
    case 'PRIORITY_P':  return runPriorityP(procs);
    case 'MLQ':         return runMLQ(procs, tq);
    default:            return runFCFS(procs);
  }
};

interface CpuSchedulingPageProps {
    showToast?: (message: string, type: ToastType) => void;
}

const CpuSchedulingPage: React.FC<CpuSchedulingPageProps> = ({ showToast }) => {
    const initial = usePermalinkState('cpu-scheduling', {
        processes: defaultProcesses as Process[],
        algorithm: 'FCFS' as SchedulingAlgorithm,
        timeQuantum: 4,
    });

    const { theme } = useTheme();
    const [processes, setProcesses] = useState<Process[]>(initial.processes);
    const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>(initial.algorithm);
    const [timeQuantum, setTimeQuantum] = useState(initial.timeQuantum);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    const comparisonData = useMemo(() => {
        if (!showComparison || processes.length === 0) return [];
        const algos: Array<{ id: SchedulingAlgorithm; label: string }> = [
            { id: 'FCFS',        label: 'FCFS' },
            { id: 'SJF',         label: 'SJF' },
            { id: 'SRTF',        label: 'SRTF' },
            { id: 'RR',          label: 'RR' },
            { id: 'PRIORITY_NP', label: 'P-NP' },
            { id: 'PRIORITY_P',  label: 'P-P' },
            { id: 'MLQ',         label: 'MLQ' },
        ];
        return algos.map(({ id, label }) => {
            const r = runSimulationLogic(processes, id, timeQuantum);
            return {
                name: label,
                'Avg Wait': parseFloat(r.metrics.averageWaitingTime.toFixed(2)),
                'Avg TAT':  parseFloat(r.metrics.averageTurnaroundTime.toFixed(2)),
                'CPU Util%': parseFloat(r.metrics.cpuUtilization.toFixed(1)),
            };
        });
    }, [showComparison, processes, timeQuantum]);

    const handleRunSimulation = () => {
        const result = runSimulationLogic(processes, algorithm, timeQuantum);
        setSimulationResult(result);
    };



  const handleReset = () => {
        setProcesses(defaultProcesses);
        setSimulationResult(null);
        setResetModalOpen(false);
    };

    const handleAddProcess = () => {
        const newId = processes.length > 0 ? Math.max(...processes.map(p => p.id)) + 1 : 1;
        const newProcess: Process = {
            id: newId,
            name: `P${newId}`,
            arrivalTime: 0,
            burstTime: 1,
            priority: 1
        };
        setProcesses([...processes, newProcess]);
    };
    
    const handleUpdateProcess = (id: number, field: keyof Process, value: number) => {
        setProcesses(processes.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleRemoveProcess = (id: number) => {
        setProcesses(processes.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">CPU Scheduling</h1>
                <div className="flex items-center gap-2">

                    <button
                        onClick={() => setIsQuizOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg"
                    >
                        <BookOpen size={18} />
                        <span>Take Quiz</span>
                    </button>
                </div>
            </div>
            
            <AlgorithmSelector 
                selectedAlgorithm={algorithm}
                onAlgorithmChange={(alg) => {
                  setAlgorithm(alg);
                  setSimulationResult(null); // Reset result on algorithm change
                }}
                timeQuantum={timeQuantum}
                onTimeQuantumChange={setTimeQuantum}
            />

            <SimulationControls 
                processes={processes}
                onAddProcess={handleAddProcess}
                onUpdateProcess={handleUpdateProcess}
                onRemoveProcess={handleRemoveProcess}
                onRunSimulation={handleRunSimulation}
                onReset={() => setResetModalOpen(true)}
                algorithm={algorithm}
            />

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end">
                {simulationResult && (
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg"
                    >
                        <Save size={18} />
                        <span className="hidden sm:inline">Save</span>
                    </button>
                )}
            </div>

            {/* A live visualization component could be placed here */}

            {simulationResult && <SimulationResults result={simulationResult} />}

            {/* Algorithm Comparison */}
            <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                        <GitCompare className="text-accent" size={20} />
                        Algorithm Comparison
                    </h2>
                    <button
                        onClick={() => setShowComparison(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                            showComparison
                                ? 'bg-accent text-accent-fg border border-white/20 shadow-pressed'
                                : 'bg-muted text-text-muted hover:bg-muted/80'
                        }`}
                    >
                        {showComparison ? 'Hide' : 'Compare All'}
                    </button>
                </div>

                {showComparison && processes.length > 0 && (
                    <div className="space-y-6">
                        <p className="text-sm text-text-muted">
                            All algorithms run on the current process set. RR and MLQ use quantum = {timeQuantum}.
                            The highlighted row is the currently selected algorithm.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="text-left py-2 pr-4 font-semibold text-text-muted">Algorithm</th>
                                        <th className="text-right py-2 px-2 font-semibold text-text-muted">Avg Wait</th>
                                        <th className="text-right py-2 px-2 font-semibold text-text-muted">Avg TAT</th>
                                        <th className="text-right py-2 px-2 font-semibold text-text-muted">CPU Util%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, i) => {
                                        const algLabel = algorithm === 'PRIORITY_NP' ? 'P-NP' : algorithm === 'PRIORITY_P' ? 'P-P' : algorithm;
                                        const isCurrent = row.name === algLabel;
                                        return (
                                            <tr key={i} className={`border-b border-white/10 transition-colors ${isCurrent ? 'bg-accent/10' : ''}`}>
                                                <td className={`py-2 pr-4 font-medium ${isCurrent ? 'text-accent' : ''}`}>{row.name}</td>
                                                <td className="py-2 px-2 text-right font-mono">{row['Avg Wait']}</td>
                                                <td className="py-2 px-2 text-right font-mono">{row['Avg TAT']}</td>
                                                <td className="py-2 px-2 text-right font-mono">{row['CPU Util%']}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
                                    <XAxis dataKey="name" stroke={theme === 'light' ? '#4b5563' : '#d1d5db'} tick={{ fontSize: 11 }} />
                                    <YAxis stroke={theme === 'light' ? '#4b5563' : '#d1d5db'} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#f0f2f5' : '#252940', borderColor: theme === 'light' ? '#e5e7eb' : '#374151', borderRadius: '0.5rem', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="Avg Wait"  fill="#6366f1" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Avg TAT"   fill="#22d3ee" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="CPU Util%" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {showComparison && processes.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-4">Add at least one process to see the comparison.</p>
                )}
            </Card>

            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleReset}
                title="Reset Simulation"
                message="Are you sure you want to reset all processes to their default values?"
                confirmText="Reset"
            />


            <SaveSimulationModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                algorithmType="cpu-scheduling"
                simulationState={{
                    processes,
                    algorithm,
                    timeQuantum,
                }}
                defaultName={`${algorithm} - ${new Date().toLocaleDateString()}`}
                ganttChartData={simulationResult?.ganttChart}
                results={simulationResult?.metrics as Record<string, any> | undefined}
            />
            
            <QuizModal 
                isOpen={isQuizOpen} 
                onClose={() => setIsQuizOpen(false)} 
                moduleId="cpu-scheduling" 
            />
        </div>
    );
};

export default CpuSchedulingPage;
