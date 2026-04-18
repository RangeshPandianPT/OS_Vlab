
import React, { useState, useMemo } from 'react';
import Card from '@/components/shared/Card';
import SaveSimulationModal from '@/components/modals/SaveSimulationModal';

import { Play, RotateCcw, ChevronRight, ChevronLeft, HardDrive, Gauge, Zap, TrendingUp, ArrowRight, Activity, Save, BookOpen, GitCompare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import QuizModal from '@/components/modals/QuizModal';
import { usePermalinkState } from '@/hooks/usePermalinkState';
import type { ToastType } from '@/components/shared/Toast';

type DiskSchedulingAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN' | 'LOOK' | 'C-LOOK';

interface DiskSchedulingPageProps {
  showToast?: (message: string, type: ToastType) => void;
}

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

const DiskSchedulingPage: React.FC<DiskSchedulingPageProps> = ({ showToast: _showToast }) => {
  const { theme } = useTheme();
  const initial = usePermalinkState('disk-scheduling', {
    algorithm: 'FCFS' as DiskSchedulingAlgorithm,
    requestQueue: '98,183,37,122,14,124,65,67',
    initialHead: 53,
    diskSize: 200,
    direction: 'right' as 'left' | 'right',
  });

  const [algorithm, setAlgorithm] = useState<DiskSchedulingAlgorithm>(initial.algorithm);
  const [requestQueue, setRequestQueue] = useState(initial.requestQueue);
  const [initialHead, setInitialHead] = useState(initial.initialHead);
  const [diskSize, setDiskSize] = useState(initial.diskSize);
  const [direction, setDirection] = useState<'left' | 'right'>(initial.direction);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Export and History state

  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const comparisonData = useMemo(() => {
    if (!showComparison) return [];
    const reqs = requestQueue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n < diskSize);
    if (reqs.length === 0) return [];
    const algos: Array<{ id: DiskSchedulingAlgorithm; label: string }> = [
      { id: 'FCFS',   label: 'FCFS'   },
      { id: 'SSTF',   label: 'SSTF'   },
      { id: 'SCAN',   label: 'SCAN'   },
      { id: 'C-SCAN', label: 'C-SCAN' },
      { id: 'LOOK',   label: 'LOOK'   },
      { id: 'C-LOOK', label: 'C-LOOK' },
    ];
    return algos.map(({ id, label }) => {
      let r: SimulationResult;
      switch (id) {
        case 'FCFS':   r = runFCFS(reqs, initialHead); break;
        case 'SSTF':   r = runSSTF(reqs, initialHead); break;
        case 'SCAN':   r = runSCAN(reqs, initialHead, direction, diskSize); break;
        case 'C-SCAN': r = runCSCAN(reqs, initialHead, diskSize); break;
        case 'LOOK':   r = runLOOK(reqs, initialHead, direction); break;
        case 'C-LOOK': r = runCLOOK(reqs, initialHead); break;
        default:       r = runFCFS(reqs, initialHead);
      }
      return {
        name: label,
        'Total Seek': r.totalSeekTime,
        'Avg Seek': parseFloat(r.averageSeekTime.toFixed(2)),
      };
    });
  }, [showComparison, requestQueue, initialHead, diskSize, direction]);

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

    const left = requests.filter(r => r < head).sort((a, b) => b - a);   // descending
    const right = requests.filter(r => r >= head).sort((a, b) => a - b); // ascending

    // Build the ordered list of positions to visit.
    // SCAN always sweeps to the physical disk edge before reversing.
    let seekSequence: number[];
    if (dir === 'right') {
      seekSequence = [...right];
      // Always go to disk end (size-1) as the turnaround point
      if (seekSequence.length === 0 || seekSequence[seekSequence.length - 1] !== size - 1) {
        seekSequence.push(size - 1);
      }
      seekSequence.push(...left);
    } else {
      seekSequence = [...left];
      // Always go to track 0 as the turnaround point
      if (seekSequence.length === 0 || seekSequence[seekSequence.length - 1] !== 0) {
        seekSequence.push(0);
      }
      seekSequence.push(...right.reverse());
    }

    seekSequence.forEach(position => {
      if (position === currentHead) return;
      const seekDistance = Math.abs(position - currentHead);
      totalSeek += seekDistance;
      // Every movement (including edge turnaround) is a seek step shown in trace
      steps.push({ from: currentHead, to: position, seekDistance });
      sequence.push(position);
      currentHead = position;
    });

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence,
    };
  };

  const runCSCAN = (requests: number[], head: number, size: number): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;

    // C-SCAN always moves RIGHT only; wraps from end to start for remaining requests
    const left = requests.filter(r => r < head).sort((a, b) => a - b);   // ascending
    const right = requests.filter(r => r >= head).sort((a, b) => a - b); // ascending

    // Service right-side requests
    right.forEach(position => {
      const seekDistance = Math.abs(position - currentHead);
      steps.push({ from: currentHead, to: position, seekDistance });
      sequence.push(position);
      totalSeek += seekDistance;
      currentHead = position;
    });

    // If there are left-side requests, sweep to end, jump to 0, then service them
    if (left.length > 0) {
      // Move head to disk end (size - 1)
      const distToEnd = Math.abs((size - 1) - currentHead);
      if (distToEnd > 0) {
        totalSeek += distToEnd;
        steps.push({ from: currentHead, to: size - 1, seekDistance: distToEnd });
        sequence.push(size - 1);
      }
      // Return jump from disk end to track 0 (counted as seek distance)
      const wrapDistance = size - 1;
      totalSeek += wrapDistance;
      steps.push({ from: size - 1, to: 0, seekDistance: wrapDistance });
      sequence.push(0);
      currentHead = 0;

      // Service left-side requests from track 0 upward
      left.forEach(position => {
        const seekDistance = Math.abs(position - currentHead);
        steps.push({ from: currentHead, to: position, seekDistance });
        sequence.push(position);
        totalSeek += seekDistance;
        currentHead = position;
      });
    }

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence,
    };
  };

  // LOOK: like SCAN but head only goes as far as the last request in each direction
  const runLOOK = (requests: number[], head: number, dir: 'left' | 'right'): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;

    const left = requests.filter(r => r < head).sort((a, b) => b - a);   // descending
    const right = requests.filter(r => r >= head).sort((a, b) => a - b); // ascending

    let seekSequence: number[];
    if (dir === 'right') {
      seekSequence = [...right, ...left];
    } else {
      seekSequence = [...left, ...right.reverse()];
    }

    seekSequence.forEach(position => {
      if (position === currentHead) return;
      const seekDistance = Math.abs(position - currentHead);
      totalSeek += seekDistance;
      steps.push({ from: currentHead, to: position, seekDistance });
      sequence.push(position);
      currentHead = position;
    });

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence,
    };
  };

  // C-LOOK: like C-SCAN but jumps from last right request directly to first left request
  const runCLOOK = (requests: number[], head: number): SimulationResult => {
    const steps: SeekStep[] = [];
    const sequence: number[] = [head];
    let currentHead = head;
    let totalSeek = 0;

    const left = requests.filter(r => r < head).sort((a, b) => a - b);   // ascending
    const right = requests.filter(r => r >= head).sort((a, b) => a - b); // ascending

    // Service right-side requests
    right.forEach(position => {
      const seekDistance = Math.abs(position - currentHead);
      steps.push({ from: currentHead, to: position, seekDistance });
      sequence.push(position);
      totalSeek += seekDistance;
      currentHead = position;
    });

    // Jump directly to the smallest left-side request (no sweep to 0)
    if (left.length > 0) {
      const firstLeft = left[0];
      const jumpDistance = Math.abs(firstLeft - currentHead);
      totalSeek += jumpDistance;
      steps.push({ from: currentHead, to: firstLeft, seekDistance: jumpDistance });
      sequence.push(firstLeft);
      currentHead = firstLeft;

      // Service remaining left requests
      left.slice(1).forEach(position => {
        const seekDistance = Math.abs(position - currentHead);
        steps.push({ from: currentHead, to: position, seekDistance });
        sequence.push(position);
        totalSeek += seekDistance;
        currentHead = position;
      });
    }

    return {
      steps,
      totalSeekTime: totalSeek,
      averageSeekTime: requests.length > 0 ? totalSeek / requests.length : 0,
      sequence,
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
      case 'LOOK':
        result = runLOOK(requests, initialHead, direction);
        break;
      case 'C-LOOK':
        result = runCLOOK(requests, initialHead);
        break;
      default:
        result = runFCFS(requests, initialHead);
    }

    setSimulation(result!);
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">Disk Scheduling Simulation</h1>
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

      {/* Algorithm Selection */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="text-accent" size={20} />
          Select Algorithm
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {((['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'] as DiskSchedulingAlgorithm[])).map(alg => {
            const gradients: Record<DiskSchedulingAlgorithm, string> = {
              'FCFS':   'from-orange-500 to-amber-500',
              'SSTF':   'from-amber-500 to-yellow-500',
              'SCAN':   'from-yellow-500 to-orange-500',
              'C-SCAN': 'from-orange-600 to-red-500',
              'LOOK':   'from-red-500 to-rose-500',
              'C-LOOK': 'from-rose-500 to-pink-500',
            };
            return (
              <button
                key={alg}
                onClick={() => setAlgorithm(alg)}
                className={`px-3 py-3 rounded-lg font-medium transition-all duration-300 text-sm ${
                  algorithm === alg
                    ? `bg-accent text-accent-fg shadow-pressed scale-105 border border-white/20`
                    : 'bg-muted text-text-muted hover:bg-muted/80'
                }`}
              >
                {alg}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Input Configuration */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <Gauge className="text-accent" size={20} />
          Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Activity size={16} className="text-text-muted" />
              Request Queue (comma-separated track numbers)
            </label>
            <input
              type="text"
              value={requestQueue}
              onChange={(e) => setRequestQueue(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-muted border border-white/40 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              placeholder="e.g., 98,183,37,122,14,124,65,67"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <ArrowRight size={16} className="text-text-muted" />
                Initial Head Position: <span className="text-accent font-bold">{initialHead}</span>
              </label>
              <input
                type="range"
                min="0"
                max={diskSize - 1}
                value={initialHead}
                onChange={(e) => setInitialHead(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>0</span>
                <span>{diskSize - 1}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <HardDrive size={16} className="text-text-muted" />
                Disk Size (tracks): <span className="text-accent font-bold">{diskSize}</span>
              </label>
              <input
                type="range"
                min="100"
                max="300"
                step="10"
                value={diskSize}
                onChange={(e) => setDiskSize(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>100</span>
                <span>300</span>
              </div>
            </div>
          </div>

          {(algorithm === 'SCAN' || algorithm === 'LOOK') && (
            <div>
              <label className="block text-sm font-medium mb-2">Initial Direction</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDirection('left')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                    direction === 'left'
                      ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20'
                      : 'bg-muted text-text-muted hover:bg-muted/80'
                  }`}
                >
                  ← Left
                </button>
                <button
                  onClick={() => setDirection('right')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                    direction === 'right'
                      ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20'
                      : 'bg-muted text-text-muted hover:bg-muted/80'
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
              className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg font-medium"
            >
              <Play size={18} />
              Run Simulation
            </button>

            {isRunning && (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/70 transition-all duration-300 font-medium"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg font-medium"
                  title="Save current state to database"
                >
                  <Save size={18} />
                  <span className="hidden sm:inline">Save</span>
                </button>


              </>
            )}
          </div>
        </div>
      </Card>

      {/* Disk Track Visualization */}
      {isRunning && simulation && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-glow"></div>
              Disk Head Movement
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="px-3 py-1 bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-text-primary rounded-lg font-medium">
                Total: {simulation.totalSeekTime}
              </span>
              <span className="px-3 py-1 bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-text-primary rounded-lg font-medium">
                Avg: {simulation.averageSeekTime.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Visual Disk Track */}
          <div className="bg-background rounded-lg border border-white/40 dark:border-white/10 p-4 mb-4 overflow-x-auto">
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
                    
                    const isServiced = simulation.sequence.slice(0, currentStep + 1).includes(req);
                    
                    return (
                      <div
                        key={`req-${idx}`}
                        className="absolute transition-all duration-500"
                        style={{ left: `${pos}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                          isServiced
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg'
                            : 'bg-gradient-to-br from-red-500 to-orange-500'
                        }`}></div>
                        <span 
                          className={`absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap px-1.5 py-0.5 rounded transition-all duration-300 ${
                            isServiced
                              ? 'bg-green-100 dark:bg-green-900/90 text-green-700 dark:text-green-300'
                              : 'bg-white/90 dark:bg-gray-900/90'
                          }`}
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
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-orange-500 animate-pulse drop-shadow-lg"></div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                  </div>
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-sm font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff] whitespace-nowrap bg-white/95 dark:bg-gray-900/95 px-2 py-1 rounded shadow-lg border border-white/40 dark:border-white/10">
                    Head: {currentHeadPos}
                  </span>
                </div>

                {/* Track markers */}
                <div className="absolute inset-x-0 -bottom-8 flex justify-between text-xs text-text-muted">
                  <span>0</span>
                  <span>{Math.floor(diskSize / 2)}</span>
                  <span>{diskSize - 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seek sequence */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              Seek Sequence:
            </h3>
            <div className="flex flex-wrap gap-2">
              {simulation.sequence.map((pos, idx) => (
                <div key={idx} className="flex items-center">
                  <div
                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-all duration-150 ${
                      idx === currentStep + 1
                        ? 'bg-accent text-accent-fg shadow-card border border-white/20 ring-2 ring-orange-300 dark:ring-orange-700 scale-110'
                        : idx <= currentStep
                        ? 'bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-text-primary'
                        : 'bg-muted text-text-muted'
                    }`}
                  >
                    {pos}
                  </div>
                  {idx < simulation.sequence.length - 1 && (
                    <span className="mx-1 text-text-muted">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current step info */}
          {currentStep < simulation.steps.length && (
            <div className="bg-panel shadow-recessed border border-white/40 dark:border-white/10 rounded-lg p-3 sm:p-4 mb-4">
              <p className="text-sm sm:text-base">
                <span className="font-semibold">Step {currentStep + 1}:</span> Move from{' '}
                <span className="font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">{simulation.steps[currentStep].from}</span> to{' '}
                <span className="font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">{simulation.steps[currentStep].to}</span>
                {' '}(Seek distance: <span className="font-bold text-text-primary">{simulation.steps[currentStep].seekDistance}</span>)
              </p>
            </div>
          )}

          {/* Step Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-sm font-medium text-text-primary drop-shadow-[0_1px_1px_#ffffff]">
              Step {currentStep + 1} / {simulation.steps.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentStep === simulation.steps.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </Card>
      )}


      {/* Algorithm Comparison */}
      <Card className="p-4 sm:p-6">
        <button
          onClick={() => setShowComparison(v => !v)}
          className="flex items-center justify-between w-full"
        >
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <GitCompare className="text-accent" size={20} />
            Algorithm Comparison
          </h2>
          <span className="text-xs font-mono text-text-muted bg-muted px-2 py-1 rounded">
            {showComparison ? 'HIDE ▲' : 'SHOW ▼'}
          </span>
        </button>

        {showComparison && (
          <div className="mt-4 space-y-4">
            {comparisonData.length === 0 ? (
              <p className="text-sm text-text-muted">Enter a valid request queue above to see comparison data.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted border-b border-border-dark/40">
                        <th className="text-left py-2 pr-4 font-semibold">Algorithm</th>
                        <th className="text-right py-2 px-4 font-semibold">Total Seek</th>
                        <th className="text-right py-2 px-4 font-semibold">Avg Seek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map(row => (
                        <tr
                          key={row.name}
                          className={`border-b border-border-dark/20 ${row.name === algorithm ? 'bg-accent/10' : ''}`}
                        >
                          <td className="py-2 pr-4 font-mono font-bold text-text-primary">
                            {row.name}
                            {row.name === algorithm && (
                              <span className="ml-2 text-xs text-accent">(current)</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right">{row['Total Seek']}</td>
                          <td className="py-2 px-4 text-right">{row['Avg Seek']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#d1d5db' : '#374151'} />
                    <XAxis dataKey="name" tick={{ fill: theme === 'light' ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
                    <YAxis tick={{ fill: theme === 'light' ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: theme === 'light' ? '#f9fafb' : '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Total Seek" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg Seek"   fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}
      </Card>

      <SaveSimulationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        algorithmType="disk-scheduling"
        simulationState={{
          algorithm,
          diskSize,
          initialHead,
          requestQueue: parseRequestQueue(requestQueue)
        }}
        defaultName={`${algorithm} Disk Simulation`}
      />

      <QuizModal 
          isOpen={isQuizOpen} 
          onClose={() => setIsQuizOpen(false)} 
          moduleId="disk-scheduling" 
      />
    </div>
  );
};

export default DiskSchedulingPage;
