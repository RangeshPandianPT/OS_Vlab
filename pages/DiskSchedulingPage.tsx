
import React, { useState } from 'react';
import Card from '../components/Card';
import { Play, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

type DiskSchedulingAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN';

interface SeekStep {
  from: number;
  to: number;
  seekDistance: number;
}

interface SimulationResult {
  steps: SeekStep[];
  totalSeekTime: number;
  averageSeekTime: number;
  sequence: number[];
}

const DiskSchedulingPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<DiskSchedulingAlgorithm>('FCFS');
  const [requestQueue, setRequestQueue] = useState('98,183,37,122,14,124,65,67');
  const [initialHead, setInitialHead] = useState(53);
  const [diskSize, setDiskSize] = useState(200);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const parseRequestQueue = (str: string): number[] => {
    return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n < diskSize);
  };

  const runFCFS = (requests: number[], head: number): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;

    requests.forEach(request => {
      const seekDistance = Math.abs(request - currentHead);
      steps.push({ from: currentHead, to: request, seekDistance });
      sequence.push(request);
      totalSeek += seekDistance;
      currentHead = request;
    });

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence
    };
  };

  const runSSTF = (requests: number[], head: number): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;
    const remaining = [...requests];

    while (remaining.length > 0) {
      let closestIndex = 0;
      let minDistance = Math.abs(remaining[0] - currentHead);

      remaining.forEach((request, idx) => {
        const distance = Math.abs(request - currentHead);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      });

      const nextRequest = remaining[closestIndex];
      steps.push({ from: currentHead, to: nextRequest, seekDistance: minDistance });
      sequence.push(nextRequest);
      totalSeek += minDistance;
      currentHead = nextRequest;
      remaining.splice(closestIndex, 1);
    }

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence
    };
  };

  const runSCAN = (requests: number[], head: number, dir: 'left' | 'right', size: number): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;

    const left = requests.filter(r => r < head).sort((a, b) => b - a);
    const right = requests.filter(r => r >= head).sort((a, b) => a - b);

    let seekSequence: number[] = [];
    if (dir === 'right') {
      seekSequence = [...right];
      if (right.length > 0 && right[right.length - 1] < size - 1) {
        seekSequence.push(size - 1);
      }
      seekSequence.push(...left);
    } else {
      seekSequence = [...left];
      if (left.length > 0 && left[left.length - 1] > 0) {
        seekSequence.push(0);
      }
      seekSequence.push(...right.reverse());
    }

    seekSequence.forEach(position => {
      const seekDistance = Math.abs(position - currentHead);
      if (requests.includes(position)) {
        steps.push({ from: currentHead, to: position, seekDistance });
        sequence.push(position);
      } else {
        // Edge movement (no service)
        if (seekDistance > 0) {
          const lastSeek = steps.length > 0 ? steps[steps.length - 1] : null;
          if (lastSeek) {
            lastSeek.seekDistance += seekDistance;
          }
        }
      }
      totalSeek += seekDistance;
      currentHead = position;
    });

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence
    };
  };

  const runCSCAN = (requests: number[], head: number, size: number): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;

    const left = requests.filter(r => r < head).sort((a, b) => a - b);
    const right = requests.filter(r => r >= head).sort((a, b) => a - b);

    // Go right first
    right.forEach(position => {
      const seekDistance = Math.abs(position - currentHead);
      steps.push({ from: currentHead, to: position, seekDistance });
      sequence.push(position);
      totalSeek += seekDistance;
      currentHead = position;
    });

    // Jump to end then start
    if (right.length > 0) {
      totalSeek += Math.abs((size - 1) - currentHead);
      currentHead = 0;
      totalSeek += (size - 1);
    }

    // Service left requests
    left.forEach(position => {
      const seekDistance = Math.abs(position - currentHead);
      steps.push({ from: currentHead, to: position, seekDistance });
      sequence.push(position);
      totalSeek += seekDistance;
      currentHead = position;
    });

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence
    };
  };

  const handleRunSimulation = () => {
    const requests = parseRequestQueue(requestQueue);
    if (requests.length === 0 || initialHead < 0 || initialHead >= diskSize) return;

    let result: SimulationResult;

    switch (algorithm) {
      case 'FCFS':
        result = runFCFS(requests, initialHead);
        break;
      case 'SSTF':
        result = runSSTF(requests, initialHead);
        break;
      case 'SCAN':
        result = runSCAN(requests, initialHead, direction, diskSize);
        break;
      case 'C-SCAN':
        result = runCSCAN(requests, initialHead, diskSize);
        break;
    }

    setSimulation(result);
    setCurrentStep(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setSimulation(null);
    setCurrentStep(0);
    setIsRunning(false);
  };

  const handleNext = () => {
    if (simulation && currentStep < simulation.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getHeadPosition = () => {
    if (!simulation || simulation.steps.length === 0) return initialHead;
    if (currentStep === 0) return simulation.sequence[0];
    return simulation.sequence[currentStep];
  };

  const currentHeadPos = getHeadPosition();
  const requests = parseRequestQueue(requestQueue);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Disk Scheduling Simulation</h1>

      {/* Algorithm Selection */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3">Select Algorithm</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['FCFS', 'SSTF', 'SCAN', 'C-SCAN'] as DiskSchedulingAlgorithm[]).map(alg => (
            <button
              key={alg}
              onClick={() => setAlgorithm(alg)}
              className={`px-4 py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
                algorithm === alg
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {alg}
            </button>
          ))}
        </div>
      </Card>

      {/* Input Configuration */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Request Queue (comma-separated track numbers)
            </label>
            <input
              type="text"
              value={requestQueue}
              onChange={(e) => setRequestQueue(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g., 98,183,37,122,14,124,65,67"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Initial Head Position: {initialHead}
              </label>
              <input
                type="range"
                min="0"
                max={diskSize - 1}
                value={initialHead}
                onChange={(e) => setInitialHead(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Disk Size (tracks): {diskSize}
              </label>
              <input
                type="range"
                min="100"
                max="300"
                step="10"
                value={diskSize}
                onChange={(e) => setDiskSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {(algorithm === 'SCAN') && (
            <div>
              <label className="block text-sm font-medium mb-2">Initial Direction</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDirection('left')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    direction === 'left'
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark'
                  }`}
                >
                  ← Left
                </button>
                <button
                  onClick={() => setDirection('right')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    direction === 'right'
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark'
                  }`}
                >
                  Right →
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunSimulation}
              className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
            >
              <Play size={18} />
              Run Simulation
            </button>

            {isRunning && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Disk Track Visualization */}
      {isRunning && simulation && (
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Disk Head Movement</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-medium">
                Total Seek: {simulation.totalSeekTime}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                Avg: {simulation.averageSeekTime.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Visual Disk Track */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Track scale */}
              <div className="relative h-32 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>

                {/* Request markers */}
                {requests
                  .map((req, idx) => ({ req, idx, pos: (req / diskSize) * 100 }))
                  .sort((a, b) => a.pos - b.pos)
                  .map(({ req, idx, pos }, sortedIdx, arr) => {
                    // Detect overlaps and alternate label positions
                    let labelOffset = 6; // Default offset below marker
                    
                    // Check if too close to previous marker
                    if (sortedIdx > 0) {
                      const prevPos = arr[sortedIdx - 1].pos;
                      const distance = pos - prevPos;
                      
                      // If markers are very close (within 5% of track), alternate positioning
                      if (distance < 5) {
                        labelOffset = sortedIdx % 2 === 0 ? 6 : -20; // Alternate above/below
                      }
                    }
                    
                    return (
                      <div
                        key={`req-${idx}`}
                        className="absolute"
                        style={{ left: `${pos}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          simulation.sequence.slice(0, currentStep + 1).includes(req)
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}></div>
                        <span 
                          className="absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap bg-white/90 dark:bg-gray-900/90 px-1 rounded"
                          style={{ top: `${labelOffset}px` }}
                        >
                          {req}
                        </span>
                      </div>
                    );
                  })}

                {/* Disk head */}
                <div
                  className="absolute transition-all duration-500 z-10"
                  style={{ left: `${(currentHeadPos / diskSize) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-accent animate-pulse"></div>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-sm font-bold text-accent whitespace-nowrap bg-white/95 dark:bg-gray-900/95 px-2 py-1 rounded shadow-sm">
                    Head: {currentHeadPos}
                  </span>
                </div>

                {/* Track markers */}
                <div className="absolute inset-x-0 -bottom-8 flex justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
                  <span>0</span>
                  <span>{Math.floor(diskSize / 2)}</span>
                  <span>{diskSize - 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seek sequence */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Seek Sequence:</h3>
            <div className="flex flex-wrap gap-2">
              {simulation.sequence.map((pos, idx) => (
                <div key={idx} className="flex items-center">
                  <div
                    className={`px-3 py-1 rounded-md font-medium text-sm ${
                      idx === currentStep + 1
                        ? 'bg-accent text-white ring-2 ring-accent/50'
                        : idx <= currentStep
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark'
                    }`}
                  >
                    {pos}
                  </div>
                  {idx < simulation.sequence.length - 1 && (
                    <span className="mx-1 text-text-muted-light dark:text-text-muted-dark">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current step info */}
          {currentStep < simulation.steps.length && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <span className="font-semibold">Step {currentStep + 1}:</span> Move from{' '}
                <span className="font-bold text-accent">{simulation.steps[currentStep].from}</span> to{' '}
                <span className="font-bold text-accent">{simulation.steps[currentStep].to}</span>
                {' '}(Seek distance: <span className="font-bold">{simulation.steps[currentStep].seekDistance}</span>)
              </p>
            </div>
          )}

          {/* Step Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
              Step {currentStep + 1} / {simulation.steps.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentStep === simulation.steps.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DiskSchedulingPage;
