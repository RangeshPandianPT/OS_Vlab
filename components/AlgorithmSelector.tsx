
import React from 'react';
import type { SchedulingAlgorithm } from '../types';
import { SCHEDULING_ALGORITHMS } from '../constants';
import Card from './Card';
import { Settings, Clock } from 'lucide-react';

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
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 border-blue-200 dark:border-blue-800">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
          <Settings size={20} />
        </div>
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Configuration</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="algorithm-select" className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"></span>
            Select Algorithm
          </label>
          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as SchedulingAlgorithm)}
            className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            {SCHEDULING_ALGORITHMS.map((alg) => (
              <option key={alg.id} value={alg.id}>
                {alg.name}
              </option>
            ))}
          </select>
        </div>
        {selectedAlgorithmDetails?.requiresTimeQuantum && (
          <div className="relative">
            <label htmlFor="time-quantum" className="block text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
              <Clock size={16} className="text-purple-500" />
              Time Quantum (ms)
            </label>
            <input
              type="number"
              id="time-quantum"
              value={timeQuantum}
              onChange={(e) => onTimeQuantumChange(Number(e.target.value))}
              min="1"
              className="w-full p-3 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none font-medium shadow-sm hover:shadow-md transition-all duration-200"
            />
            <div className="absolute right-3 top-11 text-xs font-semibold text-purple-500 dark:text-purple-400 pointer-events-none">
              ms
            </div>
          </div>
        )}
      </div>
      {selectedAlgorithmDetails && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-300 dark:border-cyan-700 shadow-inner">
            <p className="text-sm sm:text-base leading-relaxed text-text-light dark:text-text-dark font-medium">
                {selectedAlgorithmDetails.description}
            </p>
        </div>
      )}
    </Card>
  );
};

export default AlgorithmSelector;
