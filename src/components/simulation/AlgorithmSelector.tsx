import React from 'react';
import type { SchedulingAlgorithm } from '@/types';
import { SCHEDULING_ALGORITHMS } from '@/constants';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface AlgorithmSelectorProps {
  selectedAlgorithm: SchedulingAlgorithm;
  onAlgorithmChange: (alg: SchedulingAlgorithm) => void;
  timeQuantum: number;
  onTimeQuantumChange: (q: number) => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  selectedAlgorithm,
  onAlgorithmChange,
  timeQuantum,
  onTimeQuantumChange,
}) => {
  const groups = Array.from(new Set(SCHEDULING_ALGORITHMS.map(a => a.group)));
  const selected = SCHEDULING_ALGORITHMS.find(a => a.id === selectedAlgorithm);

  return (
    <Card hideDetails className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-text-primary">Algorithm</h2>
        {selected?.requiresTimeQuantum && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold font-mono uppercase tracking-wide text-text-muted whitespace-nowrap">
              Time Quantum
            </label>
            <Input
              type="number"
              value={timeQuantum}
              min={1}
              max={100}
              onChange={e => onTimeQuantumChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 h-10 text-center"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {groups.map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-text-muted mb-2 px-1">
              {group}
            </p>
            <div className="flex flex-wrap gap-2">
              {SCHEDULING_ALGORITHMS.filter(a => a.group === group).map(alg => (
                <button
                  key={alg.id}
                  onClick={() => onAlgorithmChange(alg.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wide transition-all duration-150 border ${
                    selectedAlgorithm === alg.id
                      ? 'bg-accent text-accent-fg shadow-card border-white/20'
                      : 'bg-background text-text-muted shadow-card border-transparent hover:text-text-primary hover:shadow-floating'
                  }`}
                  title={alg.description}
                >
                  {alg.shortName}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <p className="text-xs text-text-muted bg-background rounded-xl px-4 py-3 shadow-recessed leading-relaxed">
          <span className="font-bold text-text-primary">{selected.name}: </span>
          {selected.description}
        </p>
      )}
    </Card>
  );
};

export default AlgorithmSelector;
