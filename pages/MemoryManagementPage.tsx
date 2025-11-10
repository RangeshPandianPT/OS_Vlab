import React, { useState, useEffect, useMemo } from 'react';
import type { MemoryAlgorithm, MemoryBlock, MemoryProcess, MemoryMetrics } from '../types';
import Card from '../components/Card';
import MemoryBar from '../components/MemoryBar';
import ConfirmationModal from '../components/ConfirmationModal';
import { Trash2, Plus, RotateCcw, Server, Cog, Box, AlertCircle, Grid2X2 } from 'lucide-react';

const MemoryManagementPage: React.FC = () => {
  const [totalMemory, setTotalMemory] = useState(1024);
  const [initialPartitions, setInitialPartitions] = useState(1);
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([]);
  const [allocatedProcesses, setAllocatedProcesses] = useState<MemoryProcess[]>([]);
  const [algorithm, setAlgorithm] = useState<MemoryAlgorithm>('FIRST_FIT');
  const [newProcessSize, setNewProcessSize] = useState(64);
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
              newBlocks.push({
                id: i + 1,
                start: currentStart,
                size: currentBlockSize,
                isFree: true,
              });
            }
            currentStart += currentBlockSize;
            if (remainder > 0) {
                remainder--;
            }
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
    const usedMemory = memoryBlocks
        .filter(b => !b.isFree)
        .reduce((sum, b) => sum + b.size, 0);
    
    const usagePercentage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

    const freeHoles = memoryBlocks.filter(b => b.isFree);
    
    // External fragmentation: total free memory that exists in holes too small to fit the next request
    const relevantFreeHoles = freeHoles.filter(hole => hole.size < newProcessSize);
    const externalFragmentation = relevantFreeHoles.reduce((sum, hole) => sum + hole.size, 0);

    setMetrics(prev => ({
        ...prev,
        usagePercentage,
        externalFragmentation,
    }));
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
            // Search from the pointer to the end
            for (let i = nextFitPointer; i < memoryBlocks.length; i++) {
                if (memoryBlocks[i].isFree && memoryBlocks[i].size >= newProcessSize) {
                    bestHoleIndex = i;
                    break;
                }
            }
            // If not found, search from the beginning to the pointer
            if (bestHoleIndex === -1) {
                for (let i = 0; i < nextFitPointer; i++) {
                    if (memoryBlocks[i].isFree && memoryBlocks[i].size >= newProcessSize) {
                        bestHoleIndex = i;
                        break;
                    }
                }
            }
            break;
        }
        case 'BEST_FIT': {
            let smallestFitIndex = -1;
            let smallestFitSize = Infinity;
            memoryBlocks.forEach((b, index) => {
                if (b.isFree && b.size >= newProcessSize && b.size < smallestFitSize) {
                    smallestFitSize = b.size;
                    smallestFitIndex = index;
                }
            });
            bestHoleIndex = smallestFitIndex;
            break;
        }
        case 'WORST_FIT': {
            let largestFitIndex = -1;
            let largestFitSize = -1;
            memoryBlocks.forEach((b, index) => {
                if (b.isFree && b.size >= newProcessSize && b.size > largestFitSize) {
                    largestFitSize = b.size;
                    largestFitIndex = index;
                }
            });
            bestHoleIndex = largestFitIndex;
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
        id: nextBlockId,
        start: holeToFill.start,
        size: newProcessSize,
        isFree: false,
        processId: nextProcessId,
    };

    let newHoleCreated = false;
    if (holeToFill.size > newProcessSize) {
        const remainingHole: MemoryBlock = {
            ...holeToFill,
            start: holeToFill.start + newProcessSize,
            size: holeToFill.size - newProcessSize,
        };
        newBlocks.splice(bestHoleIndex, 1, newAllocatedBlock, remainingHole);
        newHoleCreated = true;
    } else {
        newBlocks.splice(bestHoleIndex, 1, newAllocatedBlock);
    }
    
    setMemoryBlocks(newBlocks);
    
    const newProcess: MemoryProcess = {
        id: nextProcessId, name: `P${nextProcessId}`, size: newProcessSize, blockId: newAllocatedBlock.id
    };
    setAllocatedProcesses(prev => [...prev, newProcess]);

    setMetrics(prev => ({ ...prev, allocations: prev.allocations + 1 }));
    setNextProcessId(prev => prev + 1);
    setNextBlockId(prev => prev + 1);
    
    let nextPointerIndex = newHoleCreated ? bestHoleIndex + 2 : bestHoleIndex + 1;
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
        const nextBlock = newBlocks[blockIndex + 1];
        newBlocks[blockIndex].size += nextBlock.size;
        newBlocks.splice(blockIndex + 1, 1);
    }

    // Coalesce with previous block
    if (blockIndex > 0 && newBlocks[blockIndex - 1].isFree) {
        const prevBlock = newBlocks[blockIndex - 1];
        newBlocks[blockIndex].start = prevBlock.start;
        newBlocks[blockIndex].size += prevBlock.size;
        newBlocks.splice(blockIndex - 1, 1);
        blockIndex--; // The current block has been merged into the previous one.
    }
    
    setMemoryBlocks(newBlocks);
    setAllocatedProcesses(prev => prev.filter(p => p.id !== processIdToDeallocate));
    setMetrics(prev => ({ ...prev, deallocations: prev.deallocations + 1 }));
  };

  const findProcessBlock = (processId: number) => memoryBlocks.find(b => b.processId === processId);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 bg-clip-text text-transparent">Memory Management</h1>
      
      {/* Educational Overview */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Server className="text-purple-500" size={24} />
          What is Memory Management?
        </h2>
        <p className="text-sm sm:text-base leading-relaxed mb-4">
          <strong>Memory Management</strong> is the process of allocating and deallocating memory space to programs. The operating system manages RAM to ensure efficient utilization, minimize fragmentation, and prevent processes from interfering with each other. This simulation demonstrates <strong>contiguous memory allocation</strong> techniques used in early operating systems.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-1">First Fit</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Allocates first suitable hole</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Best Fit</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Smallest suitable hole</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Worst Fit</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Largest suitable hole</p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Next Fit</h3>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Continues from last position</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Cog className="text-accent" size={20} />
              Configuration
            </h2>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
                      <Server size={16} /> Total Memory (KB)
                    </label>
                    <input type="number" value={totalMemory} onChange={e => setTotalMemory(Math.max(1, Number(e.target.value)))} className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
                      <Grid2X2 size={16} /> Initial Partitions
                    </label>
                    <input type="number" value={initialPartitions} onChange={e => setInitialPartitions(Math.max(1, Number(e.target.value)))} className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none" />
                  </div>
               </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
                        <Cog size={16} /> Algorithm
                    </label>
                    <select value={algorithm} onChange={e => setAlgorithm(e.target.value as MemoryAlgorithm)} className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none">
                        <option value="FIRST_FIT">First Fit</option>
                        <option value="BEST_FIT">Best Fit</option>
                        <option value="WORST_FIT">Worst Fit</option>
                        <option value="NEXT_FIT">Next Fit</option>
                    </select>
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
                        <Box size={16} /> New Process Size (KB)
                    </label>
                    <input type="number" value={newProcessSize} onChange={e => setNewProcessSize(Math.max(1, Number(e.target.value)))} className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark focus:ring-2 focus:ring-accent focus:outline-none" />
                </div>
                 {errorMessage && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500 p-3 rounded-lg animate-pulse">
                        <AlertCircle size={18} className="flex-shrink-0" />
                        <span className="break-words">{errorMessage}</span>
                    </div>
                 )}
                <div className="flex gap-2">
                    <button onClick={handleAllocate} className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300">
                        <Plus size={16} /> <span className="hidden sm:inline">Allocate</span><span className="sm:hidden">Add</span>
                    </button>
                    <button onClick={() => setResetModalOpen(true)} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300">
                        <RotateCcw size={16} /> <span className="hidden sm:inline">Reset</span>
                    </button>
                </div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Box className="text-accent" size={20} />
              Allocated Processes
            </h2>
            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
              {allocatedProcesses.length > 0 ? allocatedProcesses.map(p => {
                const block = findProcessBlock(p.id);
                const colors = [
                  'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-300 dark:border-purple-700',
                  'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-300 dark:border-blue-700',
                  'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-300 dark:border-green-700',
                  'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-300 dark:border-orange-700',
                  'bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-300 dark:border-pink-700',
                ];
                const colorClass = colors[p.id % colors.length];
                return (
                  <div key={p.id} className={`flex justify-between items-center ${colorClass} border p-3 rounded-lg transition-all duration-300 hover:shadow-md`}>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm sm:text-base">{p.name} <span className="text-xs sm:text-sm font-normal text-text-muted-light dark:text-text-muted-dark">({p.size} KB)</span></p>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">
                          Range: [{block?.start} - {block ? block.start + block.size : 'N/A'}] KB
                        </p>
                    </div>
                    <button onClick={() => handleDeallocate(p.id)} className="ml-2 p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors duration-200 flex-shrink-0" aria-label={`Deallocate ${p.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark">
                  <Box size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No processes allocated yet.</p>
                  <p className="text-xs mt-1">Click "Allocate" to add processes!</p>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Server className="text-accent" size={20} />
              Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-300 dark:border-purple-700 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-1">Memory Usage</p>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">{metrics.usagePercentage.toFixed(1)}%</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-700 rounded-lg relative group transition-all duration-300 hover:shadow-md">
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-1">External Frag.</p>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">{metrics.externalFragmentation} KB</p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                        Total free memory in holes that are too small to fit the next requested process size ({newProcessSize} KB).
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                    </div>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-300 dark:border-green-700 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-1">Allocations</p>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">{metrics.allocations}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-300 dark:border-blue-700 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-1">Deallocations</p>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">{metrics.deallocations}</p>
                </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 h-[400px] sm:h-[500px] lg:h-full">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse"></div>
                  Memory Visualization
                </h2>
                <div className="h-[calc(100%-2.5rem)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/20 dark:to-gray-900/20 rounded-lg border border-border-light dark:border-border-dark p-2 sm:p-4 overflow-auto">
                    <MemoryBar blocks={memoryBlocks} totalSize={totalMemory} />
                </div>
            </Card>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={resetSimulation}
        title="Reset Simulation"
        message="Are you sure you want to clear all allocated processes and reset the memory?"
        confirmText="Reset"
      />

      {/* Educational Content */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <Server className="text-purple-500" size={24} />
          Memory Allocation Algorithms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
              <Box size={18} />
              First Fit
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Allocates the <strong>first available hole</strong> that is large enough. Fast and simple, but may leave many small holes at the beginning of memory.
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-text-muted-light dark:text-text-muted-dark">
              <li>Fast allocation (O(n) worst case)</li>
              <li>Simple to implement</li>
              <li>May cause fragmentation early in memory</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-200 dark:border-indigo-800">
            <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
              <Box size={18} />
              Best Fit
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Searches for the <strong>smallest hole</strong> that is large enough. Minimizes wasted space but may create many tiny unusable holes.
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-text-muted-light dark:text-text-muted-dark">
              <li>Minimizes wasted space per allocation</li>
              <li>Slower (must search all holes)</li>
              <li>Creates smallest leftover fragments</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
              <Box size={18} />
              Worst Fit
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Allocates the <strong>largest available hole</strong>. Leaves larger leftover holes that may be more useful for future allocations.
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-text-muted-light dark:text-text-muted-dark">
              <li>Leaves larger usable holes</li>
              <li>Better for varying process sizes</li>
              <li>Slower (must search all holes)</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/5 to-teal-500/5 border border-cyan-200 dark:border-cyan-800">
            <h3 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
              <Box size={18} />
              Next Fit
            </h3>
            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
              Similar to First Fit, but starts searching from <strong>where the last allocation ended</strong>. Distributes holes more evenly across memory.
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-text-muted-light dark:text-text-muted-dark">
              <li>Faster than First Fit on average</li>
              <li>More uniform hole distribution</li>
              <li>May break up large holes</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Fragmentation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <p className="font-medium mb-1">External Fragmentation</p>
              <p className="text-text-muted-light dark:text-text-muted-dark">
                Total free memory is sufficient, but it exists as non-contiguous small holes. Solved by <strong>compaction</strong> (moving processes to consolidate free space).
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Internal Fragmentation</p>
              <p className="text-text-muted-light dark:text-text-muted-dark">
                Allocated memory is larger than requested, wasting space within partitions. Common in fixed-size partition schemes.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <Grid2X2 className="text-blue-500" size={24} />
          Summary
        </h2>
        <p className="text-sm sm:text-base leading-relaxed">
          Memory management is a critical function of operating systems that ensures efficient utilization of RAM. <strong>Contiguous allocation</strong> techniques like First Fit, Best Fit, Worst Fit, and Next Fit each have trade-offs between speed and fragmentation. Modern systems use more sophisticated techniques like <strong>paging</strong> and <strong>segmentation</strong> to overcome the limitations of contiguous allocation, but understanding these fundamental algorithms is essential for grasping how memory is managed at a low level. The key challenge is balancing <strong>allocation speed</strong> with minimizing <strong>external fragmentation</strong> to maintain efficient memory usage.
        </p>
      </Card>
    </div>
  );
};

export default MemoryManagementPage;
