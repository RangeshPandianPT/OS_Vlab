
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

      {/* Educational Content */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">What is Disk Scheduling?</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
          Disk scheduling algorithms determine the order in which disk I/O requests are serviced. The goal is to minimize
          the total seek time (the time it takes for the disk head to move to the requested track). Efficient disk scheduling
          improves overall system performance by reducing access latency and maximizing throughput. Different algorithms make
          different trade-offs between fairness, average seek time, and worst-case performance.
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-2">FCFS (First-Come, First-Served)</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Services requests in the order they arrive, like a simple queue. No reordering or optimization.
          </p>
          <p className="text-sm"><strong>Pros:</strong> Fair, simple, no starvation.</p>
          <p className="text-sm"><strong>Cons:</strong> Can result in excessive head movement and high seek times.</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-2">SSTF (Shortest Seek Time First)</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Services the request closest to the current head position. Greedy algorithm that minimizes immediate seek distance.
          </p>
          <p className="text-sm"><strong>Pros:</strong> Better average seek time than FCFS.</p>
          <p className="text-sm"><strong>Cons:</strong> Can cause starvation for distant requests.</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-2">SCAN (Elevator Algorithm)</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Head moves in one direction servicing requests, then reverses direction when it reaches the end of the disk.
          </p>
          <p className="text-sm"><strong>Pros:</strong> Uniform wait time, no starvation.</p>
          <p className="text-sm"><strong>Cons:</strong> Requests at edges wait longer on average.</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-2">C-SCAN (Circular SCAN)</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Similar to SCAN but only services requests in one direction, then jumps back to the start without servicing.
          </p>
          <p className="text-sm"><strong>Pros:</strong> More uniform wait times than SCAN.</p>
          <p className="text-sm"><strong>Cons:</strong> Slightly higher overhead due to return jump.</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Example Walkthrough (SSTF)</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-3">
          Given request queue: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">98, 183, 37, 122, 14, 124, 65, 67</code> and
          initial head position at <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">53</code>, SSTF will always choose
          the closest unserviced request:
        </p>
        <ol className="list-decimal pl-5 text-text-muted-light dark:text-text-muted-dark space-y-1">
          <li>Head at 53 → Closest: 65 (distance: 12)</li>
          <li>Head at 65 → Closest: 67 (distance: 2)</li>
          <li>Head at 67 → Closest: 37 (distance: 30)</li>
          <li>Head at 37 → Closest: 14 (distance: 23)</li>
          <li>Head at 14 → Closest: 98 (distance: 84)</li>
          <li>Head at 98 → Closest: 122 (distance: 24)</li>
          <li>Head at 122 → Closest: 124 (distance: 2)</li>
          <li>Head at 124 → Closest: 183 (distance: 59)</li>
        </ol>
        <p className="mt-3 text-sm text-text-muted-light dark:text-text-muted-dark">
          Total seek time: 236. Compare this to FCFS or SCAN using the simulation above!
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Algorithm Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark">
                <th className="text-left py-2 px-3">Algorithm</th>
                <th className="text-left py-2 px-3">Avg Seek Time</th>
                <th className="text-left py-2 px-3">Fairness</th>
                <th className="text-left py-2 px-3">Starvation Risk</th>
                <th className="text-left py-2 px-3">Best Use Case</th>
              </tr>
            </thead>
            <tbody className="text-text-muted-light dark:text-text-muted-dark">
              <tr className="border-b border-border-light dark:border-border-dark">
                <td className="py-2 px-3 font-medium">FCFS</td>
                <td className="py-2 px-3">High</td>
                <td className="py-2 px-3">Excellent</td>
                <td className="py-2 px-3">None</td>
                <td className="py-2 px-3">Low load, fairness priority</td>
              </tr>
              <tr className="border-b border-border-light dark:border-border-dark">
                <td className="py-2 px-3 font-medium">SSTF</td>
                <td className="py-2 px-3">Low</td>
                <td className="py-2 px-3">Poor</td>
                <td className="py-2 px-3">High</td>
                <td className="py-2 px-3">High throughput, low fairness req</td>
              </tr>
              <tr className="border-b border-border-light dark:border-border-dark">
                <td className="py-2 px-3 font-medium">SCAN</td>
                <td className="py-2 px-3">Moderate</td>
                <td className="py-2 px-3">Good</td>
                <td className="py-2 px-3">None</td>
                <td className="py-2 px-3">Balanced performance & fairness</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">C-SCAN</td>
                <td className="py-2 px-3">Moderate</td>
                <td className="py-2 px-3">Very Good</td>
                <td className="py-2 px-3">None</td>
                <td className="py-2 px-3">Uniform wait times needed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Performance Metrics</h2>
        <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark space-y-2">
          <li>
            <strong>Seek Time:</strong> Time for the disk head to move to the target track. Most significant component of disk access time.
          </li>
          <li>
            <strong>Rotational Latency:</strong> Time for the platter to rotate so the target sector is under the head (not modeled in these algorithms).
          </li>
          <li>
            <strong>Transfer Time:</strong> Time to actually read/write data once positioned (typically negligible compared to seek time).
          </li>
          <li>
            <strong>Throughput:</strong> Number of requests serviced per unit time. Algorithms like SSTF maximize throughput but may sacrifice fairness.
          </li>
          <li>
            <strong>Response Time Variance:</strong> SCAN/C-SCAN provide more predictable response times than SSTF, important for real-time systems.
          </li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Modern Considerations</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-3">
          While disk scheduling algorithms are fundamental concepts, modern storage systems have evolved:
        </p>
        <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark space-y-2">
          <li>
            <strong>SSDs (Solid State Drives):</strong> No mechanical head movement, so traditional seek time optimization is irrelevant.
            Instead, focus shifts to wear leveling and write amplification.
          </li>
          <li>
            <strong>Native Command Queuing (NCQ):</strong> Modern hard drives have built-in scheduling that reorders requests for optimal performance.
          </li>
          <li>
            <strong>I/O Schedulers in OS:</strong> Linux offers multiple schedulers (CFQ, Deadline, NOOP) that combine disk scheduling with fairness and deadline guarantees.
          </li>
          <li>
            <strong>RAID Arrays:</strong> Data striping across multiple disks changes the optimization landscape, making parallelism more important than seek time.
          </li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Summary</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
          Disk scheduling is a classic OS optimization problem that balances throughput, fairness, and response time predictability.
          FCFS is simple and fair but inefficient. SSTF minimizes average seek time but risks starvation. SCAN and C-SCAN provide
          a middle ground with bounded wait times and no starvation. Use the simulation above to visualize how each algorithm behaves
          with different request patterns and initial conditions. Understanding these principles helps in choosing appropriate I/O
          schedulers and storage configurations for modern systems, even as the underlying hardware evolves.
        </p>
      </Card>
    </div>
  );
};

export default DiskSchedulingPage;
