
import React, { useState } from 'react';
import Card from '../components/Card';
import { Play, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

type PageReplacementAlgorithm = 'FIFO' | 'LRU' | 'Optimal';

interface FrameState {
  pages: (number | null)[];
  hit: boolean;
  fault: boolean;
  currentPage: number;
  replacedIndex?: number;
}

const PageReplacementPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<PageReplacementAlgorithm>('FIFO');
  const [referenceString, setReferenceString] = useState('7,0,1,2,0,3,0,4,2,3,0,3,2');
  const [frameCount, setFrameCount] = useState(3);
  const [simulation, setSimulation] = useState<FrameState[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const parseReferenceString = (str: string): number[] => {
    return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  };

  const runFIFO = (pages: number[], frames: number): FrameState[] => {
    const states: FrameState[] = [];
    const frameTable: (number | null)[] = Array(frames).fill(null);
    let fifoQueue: number[] = [];

    pages.forEach(page => {
      const pageIndex = frameTable.indexOf(page);
      
      if (pageIndex !== -1) {
        // Page hit
        states.push({
          pages: [...frameTable],
          hit: true,
          fault: false,
          currentPage: page
        });
      } else {
        // Page fault
        let replacedIndex: number | undefined;
        
        if (frameTable.includes(null)) {
          // Empty frame available
          const emptyIndex = frameTable.indexOf(null);
          frameTable[emptyIndex] = page;
          fifoQueue.push(emptyIndex);
          replacedIndex = emptyIndex;
        } else {
          // Replace using FIFO
          replacedIndex = fifoQueue.shift()!;
          frameTable[replacedIndex] = page;
          fifoQueue.push(replacedIndex);
        }
        
        states.push({
          pages: [...frameTable],
          hit: false,
          fault: true,
          currentPage: page,
          replacedIndex
        });
      }
    });

    return states;
  };

  const runLRU = (pages: number[], frames: number): FrameState[] => {
    const states: FrameState[] = [];
    const frameTable: (number | null)[] = Array(frames).fill(null);
    const recentUse: Map<number, number> = new Map();
    let time = 0;

    pages.forEach(page => {
      time++;
      const pageIndex = frameTable.indexOf(page);
      
      if (pageIndex !== -1) {
        // Page hit
        recentUse.set(page, time);
        states.push({
          pages: [...frameTable],
          hit: true,
          fault: false,
          currentPage: page
        });
      } else {
        // Page fault
        let replacedIndex: number | undefined;
        
        if (frameTable.includes(null)) {
          // Empty frame available
          const emptyIndex = frameTable.indexOf(null);
          frameTable[emptyIndex] = page;
          recentUse.set(page, time);
          replacedIndex = emptyIndex;
        } else {
          // Replace LRU page
          let lruPage = frameTable[0]!;
          replacedIndex = 0;
          let lruTime = recentUse.get(lruPage) || 0;
          
          frameTable.forEach((p, idx) => {
            if (p !== null) {
              const useTime = recentUse.get(p) || 0;
              if (useTime < lruTime) {
                lruTime = useTime;
                lruPage = p;
                replacedIndex = idx;
              }
            }
          });
          
          frameTable[replacedIndex] = page;
          recentUse.set(page, time);
        }
        
        states.push({
          pages: [...frameTable],
          hit: false,
          fault: true,
          currentPage: page,
          replacedIndex
        });
      }
    });

    return states;
  };

  const runOptimal = (pages: number[], frames: number): FrameState[] => {
    const states: FrameState[] = [];
    const frameTable: (number | null)[] = Array(frames).fill(null);

    pages.forEach((page, currentIndex) => {
      const pageIndex = frameTable.indexOf(page);
      
      if (pageIndex !== -1) {
        // Page hit
        states.push({
          pages: [...frameTable],
          hit: true,
          fault: false,
          currentPage: page
        });
      } else {
        // Page fault
        let replacedIndex: number | undefined;
        
        if (frameTable.includes(null)) {
          // Empty frame available
          const emptyIndex = frameTable.indexOf(null);
          frameTable[emptyIndex] = page;
          replacedIndex = emptyIndex;
        } else {
          // Find page that won't be used for longest time
          let farthest = -1;
          replacedIndex = 0;
          
          frameTable.forEach((p, idx) => {
            if (p !== null) {
              let nextUse = pages.slice(currentIndex + 1).indexOf(p);
              if (nextUse === -1) {
                nextUse = Infinity;
              }
              if (nextUse > farthest) {
                farthest = nextUse;
                replacedIndex = idx;
              }
            }
          });
          
          frameTable[replacedIndex] = page;
        }
        
        states.push({
          pages: [...frameTable],
          hit: false,
          fault: true,
          currentPage: page,
          replacedIndex
        });
      }
    });

    return states;
  };

  const handleRunSimulation = () => {
    const pages = parseReferenceString(referenceString);
    if (pages.length === 0 || frameCount < 1) return;

    let states: FrameState[] = [];
    
    switch (algorithm) {
      case 'FIFO':
        states = runFIFO(pages, frameCount);
        break;
      case 'LRU':
        states = runLRU(pages, frameCount);
        break;
      case 'Optimal':
        states = runOptimal(pages, frameCount);
        break;
    }

    setSimulation(states);
    setCurrentStep(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setSimulation([]);
    setCurrentStep(0);
    setIsRunning(false);
  };

  const handleNext = () => {
    if (currentStep < simulation.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentState = simulation[currentStep];
  const pages = parseReferenceString(referenceString);
  const totalFaults = simulation.filter(s => s.fault).length;
  const totalHits = simulation.filter(s => s.hit).length;
  const faultRate = simulation.length > 0 ? ((totalFaults / simulation.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Page Replacement Simulation</h1>
      
      {/* Algorithm Selection */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3">Select Algorithm</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['FIFO', 'LRU', 'Optimal'] as PageReplacementAlgorithm[]).map(alg => (
            <button
              key={alg}
              onClick={() => setAlgorithm(alg)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
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
              Reference String (comma-separated page numbers)
            </label>
            <input
              type="text"
              value={referenceString}
              onChange={(e) => setReferenceString(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g., 7,0,1,2,0,3,0,4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Frames: {frameCount}
            </label>
            <input
              type="range"
              min="1"
              max="7"
              value={frameCount}
              onChange={(e) => setFrameCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

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

      {/* Frame Table Visualization */}
      {isRunning && simulation.length > 0 && (
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Frame Table Visualization</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                Hits: {totalHits}
              </span>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md font-medium">
                Faults: {totalFaults}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-medium">
                Fault Rate: {faultRate}%
              </span>
            </div>
          </div>

          {/* Current Page Reference */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
                Reference String:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pages.map((page, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 flex items-center justify-center rounded-md font-semibold text-sm transition-all ${
                    idx === currentStep
                      ? currentState?.hit
                        ? 'bg-green-500 text-white ring-4 ring-green-200 dark:ring-green-900 scale-110'
                        : 'bg-red-500 text-white ring-4 ring-red-200 dark:ring-red-900 scale-110'
                      : idx < currentStep
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark'
                  }`}
                >
                  {page}
                </div>
              ))}
            </div>
          </div>

          {/* Frame Table */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Frames:</span>
              {currentState && (
                <span className={`text-xs px-2 py-1 rounded ${
                  currentState.hit 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {currentState.hit ? 'HIT' : 'FAULT'}
                </span>
              )}
            </div>
            
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${frameCount}, minmax(0, 1fr))` }}>
              {currentState?.pages.map((page, idx) => (
                <div
                  key={idx}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
                    idx === currentState.replacedIndex && currentState.fault
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                      : page !== null
                      ? 'border-accent bg-accent/10'
                      : 'border-border-light dark:border-border-dark bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                    Frame {idx + 1}
                  </span>
                  <span className={`text-xl md:text-2xl font-bold ${
                    page !== null
                      ? 'text-accent'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {page !== null ? page : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

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
              Step {currentStep + 1} / {simulation.length}
            </span>
            
            <button
              onClick={handleNext}
              disabled={currentStep === simulation.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">What is Page Replacement?</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
          When a process accesses a page that is not currently loaded into a physical frame, the operating system must
          load that page from secondary storage (causing a page fault). If there are no free frames available, the OS
          must choose an existing page in memory to evict — this decision is governed by a page replacement algorithm.
          Good page replacement policies reduce page faults and improve overall performance.
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold mb-2">FIFO (First-In, First-Out)</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Evict the page that has been in memory the longest (the earliest loaded). Simple to implement using a queue.
          </p>
          <p className="text-sm"><strong>Pros:</strong> Easy, low overhead.</p>
          <p className="text-sm"><strong>Cons:</strong> Can evict frequently used pages (Belady's anomaly).</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-2">LRU (Least Recently Used)</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Evict the page which has not been used for the longest time. Approximates optimal behavior by exploiting temporal locality.
          </p>
          <p className="text-sm"><strong>Pros:</strong> Good practical performance.</p>
          <p className="text-sm"><strong>Cons:</strong> Requires tracking recent usage (can be implemented with stacks, timestamps, or hardware support like reference bits).</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-2">OPT / Belady's Optimal</h3>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
            Evict the page that will not be used for the longest time in the future. This is provably optimal but requires future knowledge.
          </p>
          <p className="text-sm"><strong>Pros:</strong> Minimum possible page faults (theoretical benchmark).</p>
          <p className="text-sm"><strong>Cons:</strong> Not implementable in practice; used for comparison and evaluation.</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Example walkthrough (LRU)</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-3">
          Given a reference string: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">7, 0, 1, 2, 0, 3, 0, 4</code> and 3 frames,
          LRU will bring pages into frames and evict the least recently used when needed. Step through the reference string and
          mark hits and faults. This walkthrough helps compare how FIFO, LRU and OPT behave on the same input.
        </p>
        <ol className="list-decimal pl-5 text-text-muted-light dark:text-text-muted-dark">
          <li>7 — fault, load into frame 1</li>
          <li>0 — fault, load into frame 2</li>
          <li>1 — fault, load into frame 3</li>
          <li>2 — fault, evict least recently used (7), load 2</li>
          <li>0 — hit (0 is in memory)</li>
          <li>3 — fault, evict least recently used (1), load 3</li>
          <li>0 — hit</li>
          <li>4 — fault, evict least recently used (2), load 4</li>
        </ol>
        <p className="mt-3 text-sm text-text-muted-light dark:text-text-muted-dark">Counting faults shows how LRU compares to FIFO/OPT.</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Pseudocode (LRU - high level)</h2>
        <pre className="text-sm bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-auto text-text-muted-light dark:text-text-muted-dark">
{`for each page in reference_string:
  if page in frames:
    record a hit; update page's recent timestamp
  else:
    record a fault
    if frames not full: insert page
    else: evict page with oldest timestamp; insert new page
`}
        </pre>
        <p className="text-sm mt-2 text-text-muted-light dark:text-text-muted-dark">Time complexity depends on how you track recency (O(1) with a hashmap + doubly-linked list).</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Performance & Practical Notes</h2>
        <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark">
          <li>OPT is a reference for evaluation; implementable approximations like LRU and clocks are used in real systems.</li>
          <li>Hardware support (reference bit / dirty bit) enables low-overhead approximations (the Clock algorithm / second-chance).</li>
          <li>Belady's anomaly: FIFO can perform worse with more frames for some reference strings — a counter-intuitive effect.</li>
          <li>Working set model and locality of reference guide memory allocation policies and when to swap or trim working sets.</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Summary</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
          Page replacement is a core OS mechanism to manage limited physical memory. Choosing the right algorithm is a trade-off between
          implementation complexity and fault rate. LRU (and its practical approximations) provide a strong balance for many workloads,
          while OPT remains useful as a lower-bound benchmark. Use visual simulations (like the frame table above) to compare behavior
          across algorithms and understand how changes in workload and frame count affect performance.
        </p>
      </Card>
    </div>
  );
};

export default PageReplacementPage;
