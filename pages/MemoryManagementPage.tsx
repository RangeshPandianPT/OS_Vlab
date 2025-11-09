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
      <h1 className="text-3xl font-bold">Memory Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
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
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                        <AlertCircle size={18} />
                        <span>{errorMessage}</span>
                    </div>
                 )}
                <div className="flex gap-2">
                    <button onClick={handleAllocate} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-colors">
                        <Plus size={16} /> Allocate
                    </button>
                    <button onClick={() => setResetModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Allocated Processes</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allocatedProcesses.length > 0 ? allocatedProcesses.map(p => {
                const block = findProcessBlock(p.id);
                return (
                  <div key={p.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                    <div>
                        <p className="font-semibold">{p.name} ({p.size} KB)</p>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                          Range: [{block?.start} - {block ? block.start + block.size : 'N/A'}] KB
                        </p>
                    </div>
                    <button onClick={() => handleDeallocate(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full" aria-label={`Deallocate ${p.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              }) : (
                <p className="text-sm text-center text-text-muted-light dark:text-text-muted-dark py-4">No processes allocated.</p>
              )}
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Metrics</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Memory Usage</p>
                    <p className="text-2xl font-bold">{metrics.usagePercentage.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg relative group">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">External Fragmentation</p>
                    <p className="text-2xl font-bold">{metrics.externalFragmentation} KB</p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        Total free memory in holes that are too small to fit the next requested process size ({newProcessSize} KB).
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Allocations</p>
                    <p className="text-2xl font-bold">{metrics.allocations}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Deallocations</p>
                    <p className="text-2xl font-bold">{metrics.deallocations}</p>
                </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="p-6 h-full">
                <h2 className="text-xl font-semibold mb-4">Memory Visualization</h2>
                <div className="h-[calc(100%-2rem)]">
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
    </div>
  );
};

export default MemoryManagementPage;
