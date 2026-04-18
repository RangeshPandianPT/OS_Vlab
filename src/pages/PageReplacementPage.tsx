import React, { useState, useMemo } from 'react';
import Card from '@/components/shared/Card';
import SaveSimulationModal from '@/components/modals/SaveSimulationModal';
import QuizModal from '@/components/modals/QuizModal';

import { Play, RotateCcw, ChevronRight, ChevronLeft, BookOpen, Layers, Clock, Zap, Save, GitCompare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { usePermalinkState } from '@/hooks/usePermalinkState';
import type { ToastType } from '@/components/shared/Toast';

type PageReplacementAlgorithm = 'FIFO' | 'LRU' | 'Optimal';

interface PageReplacementPageProps {
  showToast?: (message: string, type: ToastType) => void;
}

interface FrameState {
  pages: (number | null)[];
  hit: boolean;
  fault: boolean;
  currentPage: number;
  replacedIndex?: number;
}

const PageReplacementPage: React.FC<PageReplacementPageProps> = ({ showToast: _showToast }) => {
  const { theme } = useTheme();
  const initial = usePermalinkState('page-replacement', {
    algorithm: 'FIFO' as PageReplacementAlgorithm,
    referenceString: '7,0,1,2,0,3,0,4,2,3,0,3,2',
    frameCount: 3,
  });

  const [algorithm, setAlgorithm] = useState<PageReplacementAlgorithm>(initial.algorithm);
  const [referenceString, setReferenceString] = useState(initial.referenceString);
  const [frameCount, setFrameCount] = useState(initial.frameCount);
  const [simulation, setSimulation] = useState<FrameState[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Export and History state

  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const comparisonData = useMemo(() => {
    if (!showComparison) return [];
    const pgs = parseReferenceString(referenceString);
    if (pgs.length === 0 || frameCount < 1) return [];
    return (['FIFO', 'LRU', 'Optimal'] as PageReplacementAlgorithm[]).map(alg => {
      const states = alg === 'FIFO' ? runFIFO(pgs, frameCount)
        : alg === 'LRU' ? runLRU(pgs, frameCount)
        : runOptimal(pgs, frameCount);
      const faults = states.filter(s => s.fault).length;
      const hits   = states.filter(s => s.hit).length;
      return {
        name: alg,
        'Faults':    faults,
        'Hits':      hits,
        'Hit Rate%': parseFloat(((hits / states.length) * 100).toFixed(1)),
      };
    });
  }, [showComparison, referenceString, frameCount]);

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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">Page Replacement Simulation</h1>
        <button
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg"
        >
            <BookOpen size={18} />
            <span>Take Quiz</span>
        </button>
      </div>
      
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
                    ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-lg scale-105'
                    : alg === 'LRU'
                    ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-lg scale-105'
                    : 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-lg scale-105'
                  : 'bg-muted text-text-muted hover:bg-muted/80'
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
              <Layers size={16} className="text-text-muted" />
              Reference String (comma-separated page numbers)
            </label>
            <input
              type="text"
              value={referenceString}
              onChange={(e) => setReferenceString(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-muted border border-white/40 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              placeholder="e.g., 7,0,1,2,0,3,0,4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock size={16} className="text-text-muted" />
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
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1</span>
              <span>7</span>
            </div>
          </div>

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
                  className="flex items-center gap-2 px-6 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/70 transition-all duration-150 font-medium"
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

      {/* Frame Table Visualization */}
      {isRunning && simulation.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-glow"></div>
              Frame Table Visualization
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="px-3 py-1 bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-text-primary rounded-lg font-medium">
                ✓ Hits: {totalHits}
              </span>
              <span className="px-3 py-1 bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-text-primary rounded-lg font-medium">
                ✗ Faults: {totalFaults}
              </span>
              <span className="px-3 py-1 bg-panel shadow-recessed border border-white/40 dark:border-white/10 text-text-primary rounded-lg font-medium">
                Rate: {faultRate}%
              </span>
            </div>
          </div>

          {/* Current Page Reference */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-text-muted">
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
                      ? 'bg-gray-300 dark:bg-gray-700 text-text-primary'
                      : 'bg-muted text-text-muted'
                  }`}
                >
                  {page}
                </div>
              ))}
            </div>
          </div>

          {/* Frame Table */}
          <div className="bg-background rounded-lg border border-white/40 dark:border-white/10 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Frames:</span>
              {currentState && (
                <span className={`text-xs px-3 py-1 rounded-full font-semibold transition-all duration-300 ${
                  currentState.hit 
                    ? 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-md'
                    : 'bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg shadow-md animate-pulse'
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
                      ? 'border-red-500 bg-panel shadow-recessed animate-pulse scale-105 shadow-lg'
                      : page !== null
                      ? 'border-cyan-500 bg-panel shadow-recessed hover:shadow-md'
                      : 'border-white/40 dark:border-white/10 bg-muted'
                  }`}
                >
                  <span className="text-xs text-text-muted mb-1">
                    Frame {idx + 1}
                  </span>
                  <span className={`text-xl md:text-2xl font-bold ${
                    page !== null
                      ? 'text-text-primary drop-shadow-[0_1px_1px_#ffffff]'
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
              className="flex items-center gap-2 px-4 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            <span className="text-sm font-medium text-text-primary drop-shadow-[0_1px_1px_#ffffff]">
              Step {currentStep + 1} / {simulation.length}
            </span>
            
            <button
              onClick={handleNext}
              disabled={currentStep === simulation.length - 1}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <GitCompare className="text-accent" size={20} />
            Algorithm Comparison
          </h2>
          <button
            onClick={() => setShowComparison(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              showComparison
                ? 'bg-accent text-accent-fg border border-white/20 shadow-pressed'
                : 'bg-muted text-text-muted hover:bg-muted/80'
            }`}
          >
            {showComparison ? 'Hide' : 'Compare All'}
          </button>
        </div>

        {showComparison && comparisonData.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-text-muted">
              FIFO, LRU, and Optimal run on the current reference string with {frameCount} frame{frameCount !== 1 ? 's' : ''}.
              The highlighted row is the currently selected algorithm.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 pr-4 font-semibold text-text-muted">Algorithm</th>
                    <th className="text-right py-2 px-2 font-semibold text-text-muted">Faults</th>
                    <th className="text-right py-2 px-2 font-semibold text-text-muted">Hits</th>
                    <th className="text-right py-2 px-2 font-semibold text-text-muted">Hit Rate%</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i} className={`border-b border-white/10 transition-colors ${row.name === algorithm ? 'bg-accent/10' : ''}`}>
                      <td className={`py-2 pr-4 font-medium ${row.name === algorithm ? 'text-accent' : ''}`}>{row.name}</td>
                      <td className="py-2 px-2 text-right font-mono">{row['Faults']}</td>
                      <td className="py-2 px-2 text-right font-mono">{row['Hits']}</td>
                      <td className="py-2 px-2 text-right font-mono">{row['Hit Rate%']}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
                  <XAxis dataKey="name" stroke={theme === 'light' ? '#4b5563' : '#d1d5db'} tick={{ fontSize: 11 }} />
                  <YAxis stroke={theme === 'light' ? '#4b5563' : '#d1d5db'} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#f0f2f5' : '#252940', borderColor: theme === 'light' ? '#e5e7eb' : '#374151', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Faults"    fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Hits"      fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Hit Rate%" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {showComparison && comparisonData.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">Enter a valid reference string to see the comparison.</p>
        )}
      </Card>

      <SaveSimulationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        algorithmType="page-replacement"
        simulationState={{
          algorithm,
          frameCount,
          referenceString: parseReferenceString(referenceString)
        }}
        defaultName={`${algorithm} Page Replacement`}
      />

      <QuizModal 
          isOpen={isQuizOpen} 
          onClose={() => setIsQuizOpen(false)} 
          moduleId="page-replacement" 
      />
    </div>
  );
};

export default PageReplacementPage;
