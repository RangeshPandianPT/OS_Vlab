import React from 'react';
import type { Process, SchedulingAlgorithm } from '@/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Play, RotateCcw } from 'lucide-react';

interface SimulationControlsProps {
  processes: Process[];
  onAddProcess: () => void;
  onUpdateProcess: (id: number, field: keyof Process, value: number) => void;
  onRemoveProcess: (id: number) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  algorithm: SchedulingAlgorithm;
}

const needsPriority = (alg: SchedulingAlgorithm) =>
  ['PRIORITY_NP', 'PRIORITY_P', 'MLQ'].includes(alg);

const PROCESS_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#ef4444', '#f97316',
  '#6366f1', '#14b8a6', '#84cc16', '#a855f7',
];

const getColor = (name: string, allNames: string[]): string => {
  const idx = allNames.indexOf(name);
  return PROCESS_COLORS[idx % PROCESS_COLORS.length] || PROCESS_COLORS[0];
};

const SimulationControls: React.FC<SimulationControlsProps> = ({
  processes,
  onAddProcess,
  onUpdateProcess,
  onRemoveProcess,
  onRunSimulation,
  onReset,
  algorithm,
}) => {
  const showPriority = needsPriority(algorithm);

  return (
    <Card hideDetails className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Processes</h2>
        <button
          onClick={onAddProcess}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background shadow-card text-xs font-bold font-mono uppercase tracking-wide text-text-muted hover:text-text-primary hover:shadow-floating transition-all duration-150"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-background shadow-recessed">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border-dark/30">
              <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-text-muted">Process</th>
              <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-text-muted">Arrival</th>
              <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-text-muted">Burst</th>
              {showPriority && (
                <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-text-muted">Priority</th>
              )}
              <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-text-muted">Remove</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, _idx, arr) => (
              <tr key={p.id} className="border-b border-border-dark/20 last:border-0">
                <td className="px-4 py-2 font-bold text-text-primary">
                    <span className="flex items-center gap-2">
                        <span
                            className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: getColor(p.name, arr.map(pr => pr.name)) }}
                        />
                        {p.name}
                    </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={p.arrivalTime}
                    min={0}
                    onChange={e => onUpdateProcess(p.id, 'arrivalTime', Math.max(0, parseInt(e.target.value) || 0))}
                    className="mx-auto w-16 text-center bg-panel shadow-card rounded-lg h-8 border border-border-dark/20 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-xs text-text-primary"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={p.burstTime}
                    min={1}
                    onChange={e => onUpdateProcess(p.id, 'burstTime', Math.max(1, parseInt(e.target.value) || 1))}
                    className="mx-auto w-16 text-center bg-panel shadow-card rounded-lg h-8 border border-border-dark/20 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-xs text-text-primary"
                  />
                </td>
                {showPriority && (
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="number"
                      value={p.priority ?? 1}
                      min={1}
                      onChange={e => onUpdateProcess(p.id, 'priority', Math.max(1, parseInt(e.target.value) || 1))}
                      className="mx-auto w-16 text-center bg-panel shadow-card rounded-lg h-8 border border-border-dark/20 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-xs text-text-primary"
                    />
                  </td>
                )}
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => onRemoveProcess(p.id)}
                    disabled={processes.length <= 1}
                    className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg text-text-muted hover:text-accent hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Run / Reset */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw size={14} className="mr-1.5" />
          Reset
        </Button>
        <Button variant="primary" size="sm" onClick={onRunSimulation} disabled={processes.length === 0}>
          <Play size={14} className="mr-1.5" />
          Run Simulation
        </Button>
      </div>
    </Card>
  );
};

export default SimulationControls;
