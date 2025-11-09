// FIX: Create the SimulationControls component to resolve the "not a module" error.
import React from 'react';
import type { Process, SchedulingAlgorithm } from '../types';
import Card from './Card';
import { Play, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { SCHEDULING_ALGORITHMS } from '../constants';

interface SimulationControlsProps {
  processes: Process[];
  onAddProcess: () => void;
  onUpdateProcess: (id: number, field: keyof Process, value: number) => void;
  onRemoveProcess: (id: number) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  algorithm: SchedulingAlgorithm;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  processes,
  onAddProcess,
  onUpdateProcess,
  onRemoveProcess,
  onRunSimulation,
  onReset,
  algorithm,
}) => {
  const showPriority = SCHEDULING_ALGORITHMS.find(a => a.id === algorithm)?.requiresPriority;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">Process List</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onRunSimulation} className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-colors">
            <Play size={16} /> Run Simulation
          </button>
          <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="text-left text-text-muted-light dark:text-text-muted-dark">
            <tr>
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Arrival Time</th>
              <th className="p-2 font-medium">Burst Time</th>
              {showPriority && <th className="p-2 font-medium">Priority</th>}
              <th className="p-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id} className="border-t border-border-light dark:border-border-dark">
                <td className="p-2 font-semibold">{p.name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    value={p.arrivalTime}
                    onChange={(e) => onUpdateProcess(p.id, 'arrivalTime', Number(e.target.value))}
                    min="0"
                    className="w-20 p-1 border border-border-light dark:border-border-dark rounded-md bg-transparent focus:ring-1 focus:ring-accent focus:outline-none"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={p.burstTime}
                    onChange={(e) => onUpdateProcess(p.id, 'burstTime', Number(e.target.value))}
                    min="1"
                    className="w-20 p-1 border border-border-light dark:border-border-dark rounded-md bg-transparent focus:ring-1 focus:ring-accent focus:outline-none"
                  />
                </td>
                {showPriority && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={p.priority || 1}
                      onChange={(e) => onUpdateProcess(p.id, 'priority', Number(e.target.value))}
                      min="1"
                      className="w-20 p-1 border border-border-light dark:border-border-dark rounded-md bg-transparent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  </td>
                )}
                <td className="p-2 text-right">
                  <button onClick={() => onRemoveProcess(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <button onClick={onAddProcess} className="flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
          <Plus size={16} /> Add Process
        </button>
      </div>
    </Card>
  );
};

export default SimulationControls;
