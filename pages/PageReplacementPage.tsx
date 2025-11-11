
import React, { useState } from 'react';
import Card from '../components/Card';
import SimulationHistoryModal from '../components/SimulationHistoryModal';
import { Play, RotateCcw, ChevronRight, ChevronLeft, BookOpen, Layers, Clock, Zap, TrendingUp, CheckCircle, Download, History, FileDown, FileText } from 'lucide-react';
import { useSimulationHistory, SimulationHistoryEntry } from '../hooks/useSimulationHistory';
import { exportAsJSON, exportAsCSV, exportGanttAsText, generateDetailedReport, exportAsPDF } from '../utils/exportUtils';

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
  
  // Export and History state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { addToHistory } = useSimulationHistory();

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

    // Save to history
    const faults = states.filter(s => s.fault).length;
    const hits = states.filter(s => s.hit).length;
    
    const processes = pages.map((page, idx) => ({
      id: idx + 1,
      name: `Page ${page}`,
      arrivalTime: idx,
      burstTime: page,
      priority: 0
    }));

    addToHistory({
      simulationType: 'page-replacement',
      algorithm,
      processes,
      result: {
        ganttChart: states.map((state, idx) => ({
          processName: `P${state.currentPage}`,
          start: idx,
          duration: 1
        })),
        processMetrics: processes.map(p => ({
          ...p,
          completionTime: 0,
          turnaroundTime: 0,
          waitingTime: 0
        })),
        metrics: {
          averageWaitingTime: faults,
          averageTurnaroundTime: hits,
          cpuUtilization: (hits / (hits + faults)) * 100
        },
        totalDuration: states.length
      },
      name: `${algorithm} - ${pages.length} pages, ${frameCount} frames`
    });
  };

  const handleReset = () => {
    setSimulation([]);
    setCurrentStep(0);
    setIsRunning(false);
  };

  const handleExport = (format: 'json' | 'csv' | 'text' | 'pdf') => {
    if (simulation.length === 0) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `page-replacement-${algorithm.toLowerCase()}-${timestamp}`;

    const pages = parseReferenceString(referenceString);
    const faults = simulation.filter(s => s.fault).length;
    const hits = simulation.filter(s => s.hit).length;
    
    const processes = pages.map((page, idx) => ({
      id: idx + 1,
      name: `Page ${page}`,
      arrivalTime: idx,
      burstTime: page,
      priority: 0
    }));

    const simulationResult = {
      ganttChart: simulation.map((state, idx) => ({
        processName: `P${state.currentPage}`,
        start: idx,
        duration: 1
      })),
      processMetrics: processes.map(p => ({
        ...p,
        completionTime: 0,
        turnaroundTime: 0,
        waitingTime: 0
      })),
      metrics: {
        averageWaitingTime: faults,
        averageTurnaroundTime: hits,
        cpuUtilization: (hits / (hits + faults)) * 100
      },
      totalDuration: simulation.length
    };

    switch (format) {
      case 'json':
        exportAsJSON(
          generateDetailedReport(algorithm, processes, simulationResult),
          filename
        );
        break;
      case 'csv':
        exportAsCSV(simulationResult, filename);
        break;
      case 'text':
        exportGanttAsText(simulationResult, filename);
        break;
      case 'pdf':
        exportAsPDF(algorithm, processes, simulationResult);
        break;
    }

    setShowExportMenu(false);
  };

  const handleReplay = (entry: SimulationHistoryEntry) => {
    const pages = entry.processes.map(p => p.burstTime);
    setReferenceString(pages.join(','));
    setAlgorithm(entry.algorithm as PageReplacementAlgorithm);
    setIsHistoryModalOpen(false);
    
    setTimeout(() => {
      handleRunSimulation();
    }, 100);
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
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Page Replacement Simulation</h1>
      
      {/* Educational Overview */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-indigo-500/5 border-cyan-200 dark:border-cyan-800">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Layers className="text-cyan-500" size={24} />
          What is Page Replacement?
        </h2>
        <p className="text-sm sm:text-base leading-relaxed mb-4">
          When a process accesses a page that is not currently loaded into a physical frame, the operating system must
          load that page from secondary storage (causing a <strong>page fault</strong>). If there are no free frames available, the OS
          must choose an existing page in memory to evict — this decision is governed by a <strong>page replacement algorithm</strong>.
          Good page replacement policies reduce page faults and improve overall performance.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-1">FIFO</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">First-In, First-Out queue</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">LRU</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Least Recently Used</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Optimal</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Theoretical best (Belady's)</p>
          </div>
        </div>
      </Card>
      
      {/* Algorithm Selection */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="text-accent" size={20} />
          Select Algorithm
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['FIFO', 'LRU', 'Optimal'] as PageReplacementAlgorithm[]).map(alg => (
            <button
              key={alg}
              onClick={() => setAlgorithm(alg)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                algorithm === alg
                  ? alg === 'FIFO'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105'
                    : alg === 'LRU'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {alg}
            </button>
          ))}
        </div>
      </Card>

      {/* Input Configuration */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="text-accent" size={20} />
          Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Layers size={16} className="text-text-muted-light dark:text-text-muted-dark" />
              Reference String (comma-separated page numbers)
            </label>
            <input
              type="text"
              value={referenceString}
              onChange={(e) => setReferenceString(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              placeholder="e.g., 7,0,1,2,0,3,0,4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock size={16} className="text-text-muted-light dark:text-text-muted-dark" />
              Number of Frames: <span className="text-accent font-bold">{frameCount}</span>
            </label>
            <input
              type="range"
              min="1"
              max="7"
              value={frameCount}
              onChange={(e) => setFrameCount(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
              <span>1</span>
              <span>7</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunSimulation}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              <Play size={18} />
              Run Simulation
            </button>
            
            {isRunning && (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>

                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  <History size={18} />
                  <span className="hidden sm:inline">History</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-border-light dark:border-border-dark z-10">
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left rounded-t-lg transition-colors"
                      >
                        <FileDown size={16} />
                        <span className="text-sm">Export as JSON</span>
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                      >
                        <FileText size={16} />
                        <span className="text-sm">Export as CSV</span>
                      </button>
                      <button
                        onClick={() => handleExport('text')}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                      >
                        <FileText size={16} />
                        <span className="text-sm">Export as Text</span>
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left rounded-b-lg transition-colors"
                      >
                        <FileDown size={16} />
                        <span className="text-sm">Export as PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Frame Table Visualization */}
      {isRunning && simulation.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse"></div>
              Frame Table Visualization
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="px-3 py-1 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 rounded-lg font-medium">
                ✓ Hits: {totalHits}
              </span>
              <span className="px-3 py-1 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg font-medium">
                ✗ Faults: {totalFaults}
              </span>
              <span className="px-3 py-1 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400 rounded-lg font-medium">
                Rate: {faultRate}%
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
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/20 dark:to-gray-900/20 rounded-lg border border-border-light dark:border-border-dark p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Frames:</span>
              {currentState && (
                <span className={`text-xs px-3 py-1 rounded-full font-semibold transition-all duration-300 ${
                  currentState.hit 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md animate-pulse'
                }`}>
                  {currentState.hit ? '✓ HIT' : '✗ FAULT'}
                </span>
              )}
            </div>
            
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${frameCount}, minmax(0, 1fr))` }}>
              {currentState?.pages.map((page, idx) => (
                <div
                  key={idx}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-500 ${
                    idx === currentState.replacedIndex && currentState.fault
                      ? 'border-red-500 bg-gradient-to-br from-red-500/20 to-orange-500/20 animate-pulse scale-105 shadow-lg'
                      : page !== null
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:shadow-md'
                      : 'border-border-light dark:border-border-dark bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                    Frame {idx + 1}
                  </span>
                  <span className={`text-xl md:text-2xl font-bold ${
                    page !== null
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent'
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            <span className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Step {currentStep + 1} / {simulation.length}
            </span>
            
            <button
              onClick={handleNext}
              disabled={currentStep === simulation.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <Layers className="text-cyan-500" size={24} />
          Page Replacement Algorithms
        </h2>
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-200 dark:border-cyan-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <Clock size={18} />
              FIFO (First-In, First-Out)
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Evict the page that has been in memory the longest (the earliest loaded). Simple to implement using a queue.
            </p>
            <p className="text-xs sm:text-sm"><strong className="text-green-600 dark:text-green-400">Pros:</strong> Easy, low overhead.</p>
            <p className="text-xs sm:text-sm"><strong className="text-red-600 dark:text-red-400">Cons:</strong> Can evict frequently used pages (Belady's anomaly).</p>
          </div>

          <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <TrendingUp size={18} />
              LRU (Least Recently Used)
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Evict the page which has not been used for the longest time. Approximates optimal behavior by exploiting temporal locality.
            </p>
            <p className="text-xs sm:text-sm"><strong className="text-green-600 dark:text-green-400">Pros:</strong> Good practical performance.</p>
            <p className="text-xs sm:text-sm"><strong className="text-red-600 dark:text-red-400">Cons:</strong> Requires tracking recent usage (can be implemented with stacks, timestamps, or hardware support like reference bits).</p>
          </div>

          <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-200 dark:border-indigo-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Zap size={18} />
              OPT / Belady's Optimal
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Evict the page that will not be used for the longest time in the future. This is provably optimal but requires future knowledge.
            </p>
            <p className="text-xs sm:text-sm"><strong className="text-green-600 dark:text-green-400">Pros:</strong> Minimum possible page faults (theoretical benchmark).</p>
            <p className="text-xs sm:text-sm"><strong className="text-red-600 dark:text-red-400">Cons:</strong> Not implementable in practice; used for comparison and evaluation.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-500" size={24} />
          Example walkthrough (LRU)
        </h2>
        <p className="text-sm sm:text-base text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-3">
          Given a reference string: <code className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-300 dark:border-cyan-700 px-2 py-1 rounded font-mono">7, 0, 1, 2, 0, 3, 0, 4</code> and 3 frames,
          LRU will bring pages into frames and evict the least recently used when needed. Step through the reference string and
          mark hits and faults. This walkthrough helps compare how FIFO, LRU and OPT behave on the same input.
        </p>
        <ol className="list-decimal pl-5 text-sm sm:text-base text-text-muted-light dark:text-text-muted-dark space-y-1">
          <li><strong className="text-red-600 dark:text-red-400">7</strong> — fault, load into frame 1</li>
          <li><strong className="text-red-600 dark:text-red-400">0</strong> — fault, load into frame 2</li>
          <li><strong className="text-red-600 dark:text-red-400">1</strong> — fault, load into frame 3</li>
          <li><strong className="text-red-600 dark:text-red-400">2</strong> — fault, evict least recently used (7), load 2</li>
          <li><strong className="text-green-600 dark:text-green-400">0</strong> — hit (0 is in memory)</li>
          <li><strong className="text-red-600 dark:text-red-400">3</strong> — fault, evict least recently used (1), load 3</li>
          <li><strong className="text-green-600 dark:text-green-400">0</strong> — hit</li>
          <li><strong className="text-red-600 dark:text-red-400">4</strong> — fault, evict least recently used (2), load 4</li>
        </ol>
        <p className="mt-3 text-sm text-text-muted-light dark:text-text-muted-dark">Counting faults shows how LRU compares to FIFO/OPT.</p>
      </Card>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-200 dark:border-indigo-800">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-500" size={24} />
          Performance & Practical Notes
        </h2>
        <ul className="list-disc pl-5 text-sm sm:text-base text-text-muted-light dark:text-text-muted-dark space-y-2">
          <li><strong>OPT</strong> is a reference for evaluation; implementable approximations like <strong>LRU</strong> and <strong>clocks</strong> are used in real systems.</li>
          <li>Hardware support (reference bit / dirty bit) enables low-overhead approximations (the <strong>Clock algorithm / second-chance</strong>).</li>
          <li><strong>Belady's anomaly:</strong> FIFO can perform worse with more frames for some reference strings — a counter-intuitive effect.</li>
          <li>Working set model and locality of reference guide memory allocation policies and when to swap or trim working sets.</li>
        </ul>
      </Card>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="text-blue-500" size={24} />
          Summary
        </h2>
        <p className="text-sm sm:text-base text-text-muted-light dark:text-text-muted-dark leading-relaxed">
          Page replacement is a core OS mechanism to manage limited physical memory. Choosing the right algorithm is a trade-off between
          implementation complexity and fault rate. <strong>LRU</strong> (and its practical approximations) provide a strong balance for many workloads,
          while <strong>OPT</strong> remains useful as a lower-bound benchmark. Use visual simulations (like the frame table above) to compare behavior
          across algorithms and understand how changes in workload and frame count affect performance. Modern systems combine these techniques with <strong>demand paging</strong> and <strong>working set management</strong> for efficient memory utilization.
        </p>
      </Card>

      {/* Simulation History Modal */}
      <SimulationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onReplay={handleReplay}
        simulationType="page-replacement"
      />
    </div>
  );
};

export default PageReplacementPage;
