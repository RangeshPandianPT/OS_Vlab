
import React from 'react';
import type { SchedulingAlgorithm } from '../types';
import { SCHEDULING_ALGORITHMS } from '../constants';
import Card from './Card';

interface AlgorithmSelectorProps {
  selectedAlgorithm: SchedulingAlgorithm;
  onAlgorithmChange: (algorithm: SchedulingAlgorithm) => void;
  timeQuantum: number;
  onTimeQuantumChange: (quantum: number) => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  selectedAlgorithm,
  onAlgorithmChange,
  timeQuantum,
  onTimeQuantumChange,
}) => {
  const selectedAlgorithmDetails = SCHEDULING_ALGORITHMS.find(
    (alg) => alg.id === selectedAlgorithm
  );

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="algorithm-select" className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
            Algorithm
          </label>
          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as SchedulingAlgorithm)}
            className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none"
          >
            {SCHEDULING_ALGORITHMS.map((alg) => (
              <option key={alg.id} value={alg.id}>
                {alg.name}
              </option>
            ))}
          </select>
        </div>
        {selectedAlgorithmDetails?.requiresTimeQuantum && (
          <div>
            <label htmlFor="time-quantum" className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
              Time Quantum
            </label>
            <input
              type="number"
              id="time-quantum"
              value={timeQuantum}
              onChange={(e) => onTimeQuantumChange(Number(e.target.value))}
              min="1"
              className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>
        )}
      </div>
      {selectedAlgorithmDetails && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                {selectedAlgorithmDetails.description}
            </p>
        </div>
      )}
    </Card>
  );
};

export default AlgorithmSelector;
