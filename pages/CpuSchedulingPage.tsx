// FIX: Create the CpuSchedulingPage component to resolve the "not a module" error.
import React, { useState } from 'react';
import type { Process, SchedulingAlgorithm, SimulationResult, GanttChartEntry } from '../types';
import AlgorithmSelector from '../components/AlgorithmSelector';
import SimulationControls from '../components/SimulationControls';
import SimulationResults from '../components/SimulationResults';
import ConfirmationModal from '../components/ConfirmationModal';

const defaultProcesses: Process[] = [
  { id: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
  { id: 2, name: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: 3, name: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
  { id: 4, name: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 },
];

// NOTE: This is a simplified simulation logic for demonstration purposes.
// A full implementation would be more complex and handle all algorithms.
const runSimulationLogic = (
  procs: Process[], 
  alg: SchedulingAlgorithm, 
  tq: number
): SimulationResult => {
  // We'll use a simple FCFS logic as an example
  const processes = JSON.parse(JSON.stringify(procs)) as Process[];
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  
  const ganttChart: GanttChartEntry[] = [];
  const completedProcesses: Process[] = [];
  let currentTime = 0;
  let totalTurnaroundTime = 0;
  let totalWaitingTime = 0;
  const totalBurstTime = processes.reduce((sum, p) => sum + p.burstTime, 0);

  processes.forEach(p => {
    if (currentTime < p.arrivalTime) {
      currentTime = p.arrivalTime;
    }
    
    const waitingTime = currentTime - p.arrivalTime;
    const completionTime = currentTime + p.burstTime;
    const turnaroundTime = completionTime - p.arrivalTime;

    totalWaitingTime += waitingTime;
    totalTurnaroundTime += turnaroundTime;
    
    ganttChart.push({ processName: p.name, start: currentTime, duration: p.burstTime });
    
    completedProcesses.push({
        ...p,
        completionTime,
        turnaroundTime,
        waitingTime,
    });

    currentTime = completionTime;
  });

  const totalDuration = currentTime;
  const cpuUtilization = totalDuration > 0 ? (totalBurstTime / totalDuration) * 100 : 0;
  
  return {
      ganttChart,
      processMetrics: completedProcesses.sort((a, b) => a.id - b.id),
      totalDuration,
      metrics: {
          averageWaitingTime: procs.length > 0 ? totalWaitingTime / procs.length : 0,
          averageTurnaroundTime: procs.length > 0 ? totalTurnaroundTime / procs.length : 0,
          cpuUtilization: cpuUtilization
      }
  };
};

const CpuSchedulingPage: React.FC = () => {
    const [processes, setProcesses] = useState<Process[]>(defaultProcesses);
    const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>('FCFS');
    const [timeQuantum, setTimeQuantum] = useState(4);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const [isResetModalOpen, setResetModalOpen] = useState(false);

    const handleRunSimulation = () => {
        // A more robust solution would have different logic for each algorithm
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
            <h1 className="text-3xl font-bold">CPU Scheduling</h1>
            
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

            {/* A live visualization component could be placed here */}

            {simulationResult && <SimulationResults result={simulationResult} />}

            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleReset}
                title="Reset Simulation"
                message="Are you sure you want to reset all processes to their default values?"
                confirmText="Reset"
            />
        </div>
    );
};

export default CpuSchedulingPage;
