import React, { useState, useEffect } from 'react';
import type { MemoryAlgorithm, MemoryBlock, MemoryProcess, MemoryMetrics } from '@/types';
import Card from '@/components/shared/Card';
import MemoryBar from '@/components/simulation/MemoryBar';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import SaveSimulationModal from '@/components/modals/SaveSimulationModal';
import { Trash2, Plus, RotateCcw, Server, Cog, Box, AlertCircle, Grid2X2, Save } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import QuizModal from '@/components/modals/QuizModal';
import { usePermalinkState } from '@/hooks/usePermalinkState';
import type { ToastType } from '@/components/shared/Toast';

interface MemoryManagementPageProps {
  showToast?: (message: string, type: ToastType) => void;
}

const MemoryManagementPage: React.FC<MemoryManagementPageProps> = ({ showToast: _showToast }) => {
  const initial = usePermalinkState('memory-management', {
    algorithm: 'FIRST_FIT' as MemoryAlgorithm,
    totalMemory: 1024,
    initialPartitions: 1,
    newProcessSize: 64,
  });

  const [totalMemory, setTotalMemory] = useState(initial.totalMemory);
  const [initialPartitions, setInitialPartitions] = useState(initial.initialPartitions);
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([]);
  const [allocatedProcesses, setAllocatedProcesses] = useState<MemoryProcess[]>([]);
  const [algorithm, setAlgorithm] = useState<MemoryAlgorithm>(initial.algorithm);
  const [newProcessSize, setNewProcessSize] = useState(initial.newProcessSize);
  const [nextProcessId, setNextProcessId] = useState(1);
  const [nextBlockId, setNextBlockId] = useState(2);
  const [nextFitPointer, setNextFitPointer] = useState(0);
  const [metrics, setMetrics] = useState<MemoryMetrics>({
    usagePercentage: 0,
    externalFragmentation: 0,
    allocations: 0,
    deallocations: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const resetSimulation = () => {
    const newBlocks: MemoryBlock[] = [];
    if (initialPartitions <= 1) {
      newBlocks.push({ id: 1, start: 0, size: totalMemory, isFree: true });
    } else {
      const baseBlockSize = Math.floor(totalMemory / initialPartitions);
      let remainder = totalMemory % initialPartitions;
      let currentStart = 0;
      for (let i = 0; i < initialPartitions; i++) {
        const currentBlockSize = baseBlockSize + (remainder > 0 ? 1 : 0);
        if (currentBlockSize > 0) {
          newBlocks.push({ id: i + 1, start: currentStart, size: currentBlockSize, isFree: true });
        }
        currentStart += currentBlockSize;
        if (remainder > 0) remainder--;
      }
    }
    setMemoryBlocks(newBlocks);
    setAllocatedProcesses([]);
    setNextProcessId(1);
    setNextBlockId(newBlocks.length + 1);
    setNextFitPointer(0);
    setErrorMessage('');
    setMetrics({ usagePercentage: 0, externalFragmentation: 0, allocations: 0, deallocations: 0 });
    setResetModalOpen(false);
  };

  useEffect(() => {
    resetSimulation();
  }, [totalMemory, initialPartitions]);

  useEffect(() => {
    const usedMemory = memoryBlocks.filter(b => !b.isFree).reduce((sum, b) => sum + b.size, 0);
    const usagePercentage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
    const externalFragmentation = memoryBlocks
      .filter(b => b.isFree && b.size < newProcessSize)
      .reduce((sum, b) => sum + b.size, 0);
    setMetrics(prev => ({ ...prev, usagePercentage, externalFragmentation }));
  }, [memoryBlocks, newProcessSize, totalMemory]);

  const handleAllocate = () => {
    if (newProcessSize <= 0 || newProcessSize > totalMemory) {
      setErrorMessage('Invalid process size.');
      return;
    }
    setErrorMessage('');

    let bestHoleIndex = -1;

    switch (algorithm) {
      case 'FIRST_FIT': {
        bestHoleIndex = memoryBlocks.findIndex(b => b.isFree && b.size >= newProcessSize);
        break;
      }
      case 'NEXT_FIT': {
        for (let i = nextFitPointer; i < memoryBlocks.length; i++) {
          if (memoryBlocks[i].isFree && memoryBlocks[i].size >= newProcessSize) { bestHoleIndex = i; break; }
        }
        if (bestHoleIndex === -1) {
          for (let i = 0; i < nextFitPointer; i++) {
            if (memoryBlocks[i].isFree && memoryBlocks[i].size >= newProcessSize) { bestHoleIndex = i; break; }
          }
        }
        break;
      }
      case 'BEST_FIT': {
        let smallestFitSize = Infinity;
        memoryBlocks.forEach((b, index) => {
          if (b.isFree && b.size >= newProcessSize && b.size < smallestFitSize) {
            smallestFitSize = b.size; bestHoleIndex = index;
          }
        });
        break;
      }
      case 'WORST_FIT': {
        let largestFitSize = -1;
        memoryBlocks.forEach((b, index) => {
          if (b.isFree && b.size >= newProcessSize && b.size > largestFitSize) {
            largestFitSize = b.size; bestHoleIndex = index;
          }
        });
        break;
      }
    }

    if (bestHoleIndex === -1) {
      setErrorMessage(`Allocation failed: No suitable hole found for size ${newProcessSize}.`);
      return;
    }

    const holeToFill = memoryBlocks[bestHoleIndex];
    const newBlocks = [...memoryBlocks];
    const newAllocatedBlock: MemoryBlock = {
      id: nextBlockId, start: holeToFill.start, size: newProcessSize, isFree: false, processId: nextProcessId,
    };

    let newHoleCreated = false;
    if (holeToFill.size > newProcessSize) {
      newBlocks.splice(bestHoleIndex, 1, newAllocatedBlock, {
        ...holeToFill,
        start: holeToFill.start + newProcessSize,
        size: holeToFill.size - newProcessSize,
      });
      newHoleCreated = true;
    } else {
      newBlocks.splice(bestHoleIndex, 1, newAllocatedBlock);
    }

    setMemoryBlocks(newBlocks);
    setAllocatedProcesses(prev => [
      ...prev,
      { id: nextProcessId, name: `P${nextProcessId}`, size: newProcessSize, blockId: newAllocatedBlock.id },
    ]);
    setMetrics(prev => ({ ...prev, allocations: prev.allocations + 1 }));
    setNextProcessId(prev => prev + 1);
    setNextBlockId(prev => prev + 1);
    const nextPointerIndex = newHoleCreated ? bestHoleIndex + 2 : bestHoleIndex + 1;
    setNextFitPointer(nextPointerIndex >= newBlocks.length ? 0 : nextPointerIndex);
  };

  const handleDeallocate = (processIdToDeallocate: number) => {
    const process = allocatedProcesses.find(p => p.id === processIdToDeallocate);
    if (!process) return;

    let blockIndex = memoryBlocks.findIndex(b => b.id === process.blockId);
    if (blockIndex === -1) return;

    const newBlocks = [...memoryBlocks];
    newBlocks[blockIndex].isFree = true;
    delete newBlocks[blockIndex].processId;

    // Coalesce with next block
    if (blockIndex + 1 < newBlocks.length && newBlocks[blockIndex + 1].isFree) {
      newBlocks[blockIndex].size += newBlocks[blockIndex + 1].size;
      newBlocks.splice(blockIndex + 1, 1);
    }
    // Coalesce with previous block
    if (blockIndex > 0 && newBlocks[blockIndex - 1].isFree) {
      newBlocks[blockIndex].start = newBlocks[blockIndex - 1].start;
      newBlocks[blockIndex].size += newBlocks[blockIndex - 1].size;
      newBlocks.splice(blockIndex - 1, 1);
      blockIndex--;
    }

    setMemoryBlocks(newBlocks);
    setAllocatedProcesses(prev => prev.filter(p => p.id !== processIdToDeallocate));
    setMetrics(prev => ({ ...prev, deallocations: prev.deallocations + 1 }));
  };

  const findProcessBlock = (processId: number) => memoryBlocks.find(b => b.processId === processId);



  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">Memory Management</h1>
        <button
          onClick={() => setIsQuizOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg"
        >
          <BookOpen size={18} />
          <span>Take Quiz</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* ── Left column ── */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">

          {/* Configuration */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Cog className="text-accent" size={20} />
              Configuration
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-1">
                    <Server size={16} /> Total Memory (KB)
                  </label>
                  <input
                    type="number"
                    value={totalMemory}
                    onChange={e => setTotalMemory(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-1">
                    <Grid2X2 size={16} /> Initial Partitions
                  </label>
                  <input
                    type="number"
                    value={initialPartitions}
                    onChange={e => setInitialPartitions(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-1">
                  <Cog size={16} /> Algorithm
                </label>
                <select
                  value={algorithm}
                  onChange={e => setAlgorithm(e.target.value as MemoryAlgorithm)}
                  className="w-full p-2 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-accent focus:outline-none"
                >
                  <option value="FIRST_FIT">First Fit</option>
                  <option value="BEST_FIT">Best Fit</option>
                  <option value="WORST_FIT">Worst Fit</option>
                  <option value="NEXT_FIT">Next Fit</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-1">
                  <Box size={16} /> New Process Size (KB)
                </label>
                <input
                  type="number"
                  value={newProcessSize}
                  onChange={e => setNewProcessSize(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-text-primary bg-panel shadow-recessed border border-red-500 p-3 rounded-lg animate-pulse">
                  <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
                  <span className="break-words">{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAllocate}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg font-semibold"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Allocate</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={() => setResetModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-muted font-semibold rounded-lg hover:bg-muted/70 transition-all duration-300"
                >
                  <RotateCcw size={16} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>

              {allocatedProcesses.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20 transition-all duration-150 rounded-lg font-semibold"
                    title="Save current state"
                  >
                    <Save size={16} />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Allocated Processes */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Box className="text-accent" size={20} />
              Allocated Processes
            </h2>
            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
              {allocatedProcesses.length > 0 ? allocatedProcesses.map(p => {
                const block = findProcessBlock(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex justify-between items-center bg-panel border border-white/40 dark:border-white/10 shadow-card p-3 rounded-lg hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-sm sm:text-base">
                        {p.name} <span className="text-xs sm:text-sm font-normal text-text-muted">({p.size} KB)</span>
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        Range: [{block?.start} – {block ? block.start + block.size : 'N/A'}] KB
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeallocate(p.id)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors duration-200 flex-shrink-0"
                      aria-label={`Deallocate ${p.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-text-muted">
                  <Box size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No processes allocated yet.</p>
                  <p className="text-xs mt-1">Click "Allocate" to add processes!</p>
                </div>
              )}
            </div>
          </Card>

          {/* Metrics */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Server className="text-accent" size={20} />
              Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
              <div className="p-3 sm:p-4 bg-panel shadow-recessed border border-white/40 dark:border-white/10 rounded-lg transition-all duration-300 hover:shadow-md">
                <p className="text-xs sm:text-sm text-text-muted mb-1">Memory Usage</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">{metrics.usagePercentage.toFixed(1)}%</p>
              </div>
              <div className="p-3 sm:p-4 bg-panel shadow-recessed border border-white/40 dark:border-white/10 rounded-lg relative group transition-all duration-300 hover:shadow-md">
                <p className="text-xs sm:text-sm text-text-muted mb-1">External Frag.</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">{metrics.externalFragmentation} KB</p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                  Free memory in holes too small to fit the next request ({newProcessSize} KB).
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-panel shadow-recessed border border-white/40 dark:border-white/10 rounded-lg transition-all duration-300 hover:shadow-md">
                <p className="text-xs sm:text-sm text-text-muted mb-1">Allocations</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">{metrics.allocations}</p>
              </div>
              <div className="p-3 sm:p-4 bg-panel shadow-recessed border border-white/40 dark:border-white/10 rounded-lg transition-all duration-300 hover:shadow-md">
                <p className="text-xs sm:text-sm text-text-muted mb-1">Deallocations</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">{metrics.deallocations}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right column: visualization ── */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6 h-[400px] sm:h-[500px] lg:h-full">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-glow" />
              Memory Visualization
            </h2>
            <div className="flex-1 w-full min-h-[300px] bg-panel rounded-lg border border-white/40 dark:border-white/10 p-2 sm:p-4 overflow-hidden flex flex-col">
              <div className="flex-1 w-full relative min-h-0">
                <div className="absolute inset-0">
                  <MemoryBar blocks={memoryBlocks} totalSize={totalMemory} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={resetSimulation}
        title="Reset Memory Simulation"
        message="Are you sure you want to reset the simulation? All allocated processes will be removed."
      />

      <SaveSimulationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        algorithmType="memory-management"
        simulationState={{ algorithm, totalMemory, initialPartitions, memoryBlocks, allocatedProcesses }}
        defaultName={`${algorithm} Memory Simulation`}
      />

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        moduleId="memory-management"
      />
    </div>
  );
};

export default MemoryManagementPage;
