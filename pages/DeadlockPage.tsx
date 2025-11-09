import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { DeadlockProcessNode, DeadlockResourceNode, Allocation, Request, BankerState, LogEntry, BankerResult, BankerStep } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { Plus, Trash2, Link, Unlink, ShieldCheck, RotateCcw, AlertTriangle, Info, CheckCircle, XCircle, Zap } from 'lucide-react';

const RAG_WIDTH = 800;
const RAG_HEIGHT = 500;
const P_RADIUS = 25;
const R_WIDTH = 50;
const R_HEIGHT = 50;

// --- RAG SVG Component ---
const ResourceAllocationGraph: React.FC<{
    processes: DeadlockProcessNode[],
    resources: DeadlockResourceNode[],
    allocations: Allocation[],
    requests: Request[],
    deadlockedNodes: Set<string>,
}> = ({ processes, resources, allocations, requests, deadlockedNodes }) => {
    
    const nodePositions = useMemo(() => {
        const positions = new Map<string, { x: number, y: number }>();
        const pColX = 150;
        const rColX = RAG_WIDTH - 200;

        processes.forEach((p, i) => {
            positions.set(`P${p.id}`, { x: pColX, y: (i + 1) * (RAG_HEIGHT / (processes.length + 1)) });
        });
        resources.forEach((r, i) => {
            positions.set(`R${r.id}`, { x: rColX, y: (i + 1) * (RAG_HEIGHT / (resources.length + 1)) });
        });
        return positions;
    }, [processes, resources]);

    const edges = useMemo(() => {
        const allEdges: any[] = [];
        requests.forEach((req, i) => {
            const pNode = `P${req.processId}`;
            const rNode = `R${req.resourceId}`;
            const pPos = nodePositions.get(pNode);
            const rPos = nodePositions.get(rNode);
            if (pPos && rPos) {
                allEdges.push({
                    key: `req-${i}`, type: 'request',
                    x1: pPos.x + P_RADIUS, y1: pPos.y,
                    x2: rPos.x - R_WIDTH / 2, y2: rPos.y,
                    isDeadlocked: deadlockedNodes.has(pNode) && deadlockedNodes.has(rNode),
                });
            }
        });
        allocations.forEach((alloc, i) => {
            const pNode = `P${alloc.processId}`;
            const rNode = `R${alloc.resourceId}`;
            const pPos = nodePositions.get(pNode);
            const rPos = nodePositions.get(rNode);
            if (pPos && rPos) {
                 allEdges.push({
                    key: `alloc-${i}`, type: 'allocation',
                    x1: rPos.x + R_WIDTH / 2, y1: rPos.y,
                    x2: pPos.x - P_RADIUS, y2: pPos.y,
                    isDeadlocked: deadlockedNodes.has(pNode) && deadlockedNodes.has(rNode),
                });
            }
        });
        return allEdges;
    }, [requests, allocations, nodePositions, deadlockedNodes]);

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${RAG_WIDTH} ${RAG_HEIGHT}`}>
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
            </defs>
            {/* Edges */}
            {edges.map(edge => (
                <path
                    key={edge.key}
                    d={`M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`}
                    className={`fill-none ${edge.isDeadlocked ? 'stroke-red-500 text-red-500' : 'stroke-gray-400 dark:stroke-gray-500 text-gray-400 dark:text-gray-500'}`}
                    strokeWidth="2"
                    strokeDasharray={edge.type === 'request' ? '8 4' : 'none'}
                    markerEnd="url(#arrow)"
                />
            ))}
            {/* Nodes */}
            {processes.map(p => {
                const pos = nodePositions.get(`P${p.id}`);
                if (!pos) return null;
                const isDeadlocked = deadlockedNodes.has(`P${p.id}`);
                return (
                    <g key={`P${p.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                        <circle cx="0" cy="0" r={P_RADIUS} className={`stroke-2 ${isDeadlocked ? 'fill-red-500/10 stroke-red-500' : 'fill-bkg-light dark:fill-bkg-dark stroke-accent'}`} />
                        <text textAnchor="middle" dy=".3em" className="font-bold fill-current">{p.name}</text>
                    </g>
                );
            })}
            {resources.map(r => {
                const pos = nodePositions.get(`R${r.id}`);
                if (!pos) return null;
                const isDeadlocked = deadlockedNodes.has(`R${r.id}`);
                return (
                    <g key={`R${r.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                        <rect x={-R_WIDTH / 2} y={-R_HEIGHT / 2} width={R_WIDTH} height={R_HEIGHT} className={`stroke-2 ${isDeadlocked ? 'fill-red-500/10 stroke-red-500' : 'fill-bkg-light dark:fill-bkg-dark stroke-green-500'}`} />
                        <text textAnchor="middle" y={-R_HEIGHT / 2 - 8} className="font-bold fill-current">{r.name}</text>
                        {Array.from({ length: r.totalInstances }).map((_, i) => {
                            const cols = Math.ceil(Math.sqrt(r.totalInstances));
                            const x = (i % cols) * 10 - (cols - 1) * 5;
                            const y = Math.floor(i / cols) * 10 - (Math.ceil(r.totalInstances / cols) - 1) * 5;
                            return <circle key={i} cx={x} cy={y} r="3" className="fill-current" />;
                        })}
                    </g>
                );
            })}
        </svg>
    );
};

// --- AddResourceModal ---
const AddResourceModal: React.FC<{
  onClose: () => void;
  onAdd: (name: string, instances: number) => void;
}> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [instances, setInstances] = useState(1);
    
    const handleAdd = () => {
        if (name.trim() && instances > 0) {
            onAdd(name.trim(), instances);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add New Resource">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Resource Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., R1, Printer" className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark" />
                </div>
                <div>
                    <label className="text-sm font-medium">Total Instances</label>
                    <input type="number" min="1" value={instances} onChange={e => setInstances(parseInt(e.target.value) || 1)} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleAdd} className="btn-primary">Add</button>
                </div>
            </div>
        </Modal>
    );
};


// --- EdgeModal (Request/Release) ---
const EdgeModal: React.FC<{
  type: 'request' | 'release';
  processes: DeadlockProcessNode[];
  resources: DeadlockResourceNode[];
  allocations: Allocation[];
  onClose: () => void;
  onConfirm: (pId: number, rId: number) => void;
}> = ({ type, processes, resources, allocations, onClose, onConfirm }) => {
    const [pId, setPId] = useState<string>(processes[0]?.id.toString() || '');
    const [rId, setRId] = useState<string>(resources[0]?.id.toString() || '');

    const handleConfirm = () => {
        if (pId && rId) {
            onConfirm(parseInt(pId), parseInt(rId));
        }
    };

    const title = type === 'request' ? 'Request Resource' : 'Release Resource';
    const availableToRelease = useMemo(() => {
        if (type !== 'release') return [];
        return allocations
            .filter(a => a.processId === parseInt(pId))
            .map(a => resources.find(r => r.id === a.resourceId))
            .filter(Boolean);
    }, [type, pId, allocations, resources]);

    useEffect(() => {
      if (type === 'release' && availableToRelease.length > 0) {
        setRId(availableToRelease[0]!.id.toString());
      } else if (type === 'release') {
        setRId('');
      }
    }, [pId, type, availableToRelease]);


    return (
        <Modal isOpen={true} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Process</label>
                    <select value={pId} onChange={e => setPId(e.target.value)} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark">
                        {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Resource</label>
                    <select value={rId} onChange={e => setRId(e.target.value)} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark" disabled={type==='release' && availableToRelease.length === 0}>
                        {type === 'request' ? (
                            resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                        ) : (
                            availableToRelease.map(r => <option key={r!.id} value={r!.id}>{r!.name}</option>)
                        )}
                    </select>
                     {type==='release' && availableToRelease.length === 0 && <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">P{pId} has no resources to release.</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleConfirm} className="btn-primary" disabled={!pId || !rId}>Confirm</button>
                </div>
            </div>
        </Modal>
    );
};


// --- BANKER'S ALGORITHM SETUP MODAL ---
const BankerSetupModal: React.FC<{
  onClose: () => void;
  onRun: (state: BankerState) => void;
  initialState?: BankerState | null;
}> = ({ onClose, onRun, initialState }) => {
    const [pCount, setPCount] = useState(initialState?.processCount || 5);
    const [rCount, setRCount] = useState(initialState?.resourceCount || 3);

    const defaultState = useMemo(() => ({
        allocation: [ [0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2] ],
        max: [ [7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3] ],
        available: [3, 3, 2],
    }), []);

    const [allocation, setAllocation] = useState<number[][]>(initialState?.allocation || defaultState.allocation);
    const [max, setMax] = useState<number[][]>(initialState?.max || defaultState.max);
    const [available, setAvailable] = useState<number[]>(initialState?.available || defaultState.available);

    useEffect(() => {
        const newAllocation = Array.from({ length: pCount }, (_, i) =>
            Array.from({ length: rCount }, (_, j) => allocation[i]?.[j] || 0)
        );
        setAllocation(newAllocation);
        const newMax = Array.from({ length: pCount }, (_, i) =>
            Array.from({ length: rCount }, (_, j) => max[i]?.[j] || 0)
        );
        setMax(newMax);
    }, [pCount, rCount]);

    useEffect(() => {
        const newAvailable = Array.from({ length: rCount }, (_, j) => available[j] || 0);
        setAvailable(newAvailable);
    }, [rCount]);
    
    const handleMatrixChange = (pIndex: number, rIndex: number, value: string, matrix: number[][], setter: React.Dispatch<React.SetStateAction<number[][]>>) => {
        const newMatrix = matrix.map(row => [...row]);
        newMatrix[pIndex][rIndex] = parseInt(value) || 0;
        setter(newMatrix);
    };
    
    const handleVectorChange = (rIndex: number, value: string) => {
        const newVector = [...available];
        newVector[rIndex] = parseInt(value) || 0;
        setAvailable(newVector);
    };

    const handleRun = () => {
        onRun({ allocation, max, available, processCount: pCount, resourceCount: rCount });
    };

    const MatrixInput: React.FC<{ title: string; matrix: number[][]; setter: any; }> = ({ title, matrix, setter }) => (
        <div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-center text-sm">
                    <thead>
                        <tr>
                            <th className="p-1"></th>
                            {Array.from({ length: rCount }).map((_, i) => <th key={i} className="p-1 font-medium">R{i}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: pCount }).map((_, pIdx) => (
                            <tr key={pIdx}>
                                <td className="p-1 font-medium">P{pIdx}</td>
                                {Array.from({ length: rCount }).map((_, rIdx) => (
                                    <td key={rIdx} className="p-1">
                                        <input type="number" min="0" value={matrix[pIdx]?.[rIdx] ?? 0}
                                               onChange={(e) => handleMatrixChange(pIdx, rIdx, e.target.value, matrix, setter)}
                                               className="w-14 p-1 border border-border-light dark:border-border-dark rounded-md bg-transparent focus:ring-1 focus:ring-accent focus:outline-none text-center" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Banker's Algorithm Setup">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Processes</label>
                        <input type="number" min="1" value={pCount} onChange={e => setPCount(parseInt(e.target.value))} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Resources</label>
                        <input type="number" min="1" value={rCount} onChange={e => setRCount(parseInt(e.target.value))} className="w-full p-2 mt-1 border border-border-light dark:border-border-dark rounded-lg bg-bkg-light dark:bg-bkg-dark" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MatrixInput title="Allocation" matrix={allocation} setter={setAllocation} />
                    <MatrixInput title="Max" matrix={max} setter={setMax} />
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold mb-2">Available Resources</h3>
                    <div className="flex gap-2 justify-center">
                        {Array.from({ length: rCount }).map((_, rIdx) => (
                             <div key={rIdx} className="text-center">
                                <label className="text-sm font-medium">R{rIdx}</label>
                                <input type="number" min="0" value={available[rIdx] ?? 0}
                                       onChange={(e) => handleVectorChange(rIdx, e.target.value)}
                                       className="w-16 p-1 mt-1 border border-border-light dark:border-border-dark rounded-md bg-transparent focus:ring-1 focus:ring-accent focus:outline-none text-center" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleRun} className="btn-primary">Run Algorithm</button>
                </div>
            </div>
             <style>{`
                .btn-primary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-colors; }
                .btn-secondary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors; }
            `}</style>
        </Modal>
    );
};

// --- BANKER'S ALGORITHM RESULT MODAL ---
const BankerResultModal: React.FC<{
    result: BankerResult;
    onClose: () => void;
}> = ({ result, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title="Banker's Algorithm Results">
            <div className="space-y-4">
                <div className={`p-4 rounded-lg flex items-center gap-3 ${result.isSafe ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {result.isSafe ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                    <div>
                        <h3 className="text-lg font-bold">{`System is in a ${result.isSafe ? 'SAFE' : 'UNSAFE'} state.`}</h3>
                        {result.isSafe && <p className="font-mono text-sm">Safe Sequence: &lt;{result.sequence.map(p => `P${p}`).join(', ')}&gt;</p>}
                    </div>
                </div>
                
                <div>
                    <h4 className="text-md font-semibold mb-2">Execution Steps:</h4>
                    <div className="max-h-80 overflow-y-auto border border-border-light dark:border-border-dark rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50">
                        <table className="w-full text-xs text-left">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="p-2 font-medium">Step</th><th className="p-2 font-medium">Process</th>
                                    <th className="p-2 font-medium">Work</th><th className="p-2 font-medium">Need</th>
                                    <th className="p-2 font-medium">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.steps.map(step => (
                                    <tr key={step.step} className="border-t border-border-light dark:border-border-dark">
                                        <td className="p-2">{step.step}</td>
                                        <td className="p-2 font-bold">P{step.processIndex}</td>
                                        <td className="p-2 font-mono">[{step.work.join(', ')}]</td>
                                        <td className="p-2 font-mono">[{step.need.join(', ')}]</td>
                                        <td className={`p-2 ${step.isAllocatable ? 'text-green-500' : 'text-amber-500'}`}>{step.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                     <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- DEADLOCK RESOLUTION MODAL ---
const ResolveDeadlockModal: React.FC<{
  deadlockedProcesses: number[];
  onClose: () => void;
  onResolve: (processId: number) => void;
}> = ({ deadlockedProcesses, onClose, onResolve }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Resolve Deadlock">
      <div className="space-y-4">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          A deadlock has been detected. To resolve it, you can terminate one of the processes involved in the cycle.
        </p>
        <div>
          <h3 className="font-semibold mb-2">Processes in cycle:</h3>
          <div className="flex flex-wrap gap-2">
            {deadlockedProcesses.map(pid => (
              <button
                key={pid}
                onClick={() => onResolve(pid)}
                className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
              >
                Terminate P{pid}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
      <style>{`.btn-secondary { @apply px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors; }`}</style>
    </Modal>
  );
};


// --- CYCLE DETECTION LOGIC ---
const hasCycle = (processes: DeadlockProcessNode[], resources: DeadlockResourceNode[], allocations: Allocation[], requests: Request[]): { cycles: number[][], deadlockedNodes: Set<string> } => {
  const adj: Map<string, string[]> = new Map();
  const allProcessNodes = processes.map(p => `P${p.id}`);
  const allResourceNodes = resources.map(r => `R${r.id}`);
  [...allProcessNodes, ...allResourceNodes].forEach(node => adj.set(node, []));

  requests.forEach(req => {
    const from = `P${req.processId}`;
    const to = `R${req.resourceId}`;
    if (adj.has(from)) adj.get(from)!.push(to);
  });
  allocations.forEach(alloc => {
    const from = `R${alloc.resourceId}`;
    const to = `P${alloc.processId}`;
    if (adj.has(from)) adj.get(from)!.push(to);
  });

  const path = new Set<string>();
  const visited = new Set<string>();
  const cycles: number[][] = [];
  const deadlockedNodes = new Set<string>();

  const dfs = (node: string) => {
    path.add(node);
    visited.add(node);

    for (const neighbor of adj.get(node) || []) {
      if (path.has(neighbor)) {
        // Cycle detected
        const cycleNodes = Array.from(path);
        const cycleStartIndex = cycleNodes.indexOf(neighbor);
        const detectedCycle = cycleNodes.slice(cycleStartIndex);
        const pNodesInCycle = detectedCycle.filter(n => n.startsWith('P')).map(n => parseInt(n.substring(1)));
        if (pNodesInCycle.length > 0) {
            cycles.push(pNodesInCycle);
        }
        detectedCycle.forEach(n => deadlockedNodes.add(n));
      } else if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
    path.delete(node);
  };

  for (const node of [...allProcessNodes, ...allResourceNodes]) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }
  return { cycles, deadlockedNodes };
};


// --- MAIN COMPONENT ---
const DeadlockPage: React.FC = () => {
  const [processes, setProcesses] = useState<DeadlockProcessNode[]>([]);
  const [resources, setResources] = useState<DeadlockResourceNode[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [deadlockedInfo, setDeadlockedInfo] = useState<{ cycles: number[][], deadlockedNodes: Set<string> }>({ cycles: [], deadlockedNodes: new Set() });
  
  const [modal, setModal] = useState<'addResource' | 'request' | 'release' | 'banker' | 'bankerResult' | 'resolve' | null>(null);
  const [bankerState, setBankerState] = useState<BankerState | null>(null);
  const [bankerResult, setBankerResult] = useState<BankerResult | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
      setLog(prev => [{ id: Date.now(), message, type, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 100));
  }, []);
  
  useEffect(() => {
    const info = hasCycle(processes, resources, allocations, requests);
    const wasDeadlocked = deadlockedInfo.cycles.length > 0;
    const isDeadlocked = info.cycles.length > 0;
    
    setDeadlockedInfo(info);

    if (isDeadlocked && !wasDeadlocked) {
      const cycleText = info.cycles.map(c => c.map(id => `P${id}`).join(' -> ')).join(', ');
      addLog(`Deadlock detected! Cycle: ${cycleText}`, 'error');
    } else if (!isDeadlocked && wasDeadlocked) {
      addLog(`Deadlock resolved.`, 'success');
    }
  }, [processes, resources, allocations, requests, addLog, deadlockedInfo.cycles.length]);

  const resetSimulation = () => {
    setProcesses([]);
    setResources([]);
    setAllocations([]);
    setRequests([]);
    setLog([]);
    setDeadlockedInfo({ cycles: [], deadlockedNodes: new Set() });
    setBankerState(null);
    setBankerResult(null);
    addLog('Simulation reset.', 'info');
  };

  const handleAddProcess = () => {
    const newId = (processes.length > 0 ? Math.max(...processes.map(p => p.id)) : 0) + 1;
    setProcesses([...processes, { id: newId, name: `P${newId}` }]);
    addLog(`Process P${newId} created.`, 'info');
  };
  
  const handleAddResource = (name: string, instances: number) => {
    const newId = (resources.length > 0 ? Math.max(...resources.map(r => r.id)) : 0) + 1;
    setResources([...resources, { id: newId, name: name || `R${newId}`, totalInstances: instances }]);
    addLog(`Resource ${name || `R${newId}`} with ${instances} instance(s) created.`, 'info');
    setModal(null);
  };

  const handleRequest = (processId: number, resourceId: number) => {
      if (requests.some(r => r.processId === processId && r.resourceId === resourceId)) return;
      setRequests([...requests, { processId, resourceId, instances: 1 }]);
      addLog(`P${processId} requested R${resourceId}.`, 'action');
      setModal(null);
  };

  const handleRelease = (processId: number, resourceId: number) => {
      setAllocations(allocs => allocs.filter(a => !(a.processId === processId && a.resourceId === resourceId)));
      addLog(`P${processId} released R${resourceId}.`, 'action');
      setModal(null);
  };
  
  const handleRemoveProcess = (id: number) => {
    setProcesses(processes.filter(p => p.id !== id));
    setAllocations(allocations.filter(a => a.processId !== id));
    setRequests(requests.filter(r => r.processId !== id));
    addLog(`Process P${id} and its edges were removed.`, 'info');
  };
  
  const handleResolveDeadlock = (processId: number) => {
    handleRemoveProcess(processId);
    addLog(`Deadlock recovery: Terminated process P${processId}.`, 'action');
    setModal(null);
  };
  
  const runBanker = (state: BankerState) => {
    const { allocation, max, available, processCount, resourceCount } = state;
    setBankerState(state);
    const need = Array.from({ length: processCount }, (_, i) =>
        Array.from({ length: resourceCount }, (_, j) => max[i][j] - allocation[i][j])
    );
    const finish = Array(processCount).fill(false);
    const work = [...available];
    const safeSequence: number[] = [];
    const steps: BankerStep[] = [];

    let loopCount = 0;
    while (safeSequence.length < processCount) {
        let found = false;
        for (let i = 0; i < processCount; i++) {
            if (!finish[i]) {
                const need_i = need[i];
                let canAllocate = true;
                for (let j = 0; j < resourceCount; j++) {
                    if (need_i[j] > work[j]) {
                        canAllocate = false;
                        break;
                    }
                }
                
                let message = `Check P${i}: Need <= Work? ([${need_i.join(', ')}]) <= ([${work.join(', ')}]) -> ${canAllocate ? 'Yes' : 'No. Must wait.'}`;
                const step: BankerStep = {
                    step: steps.length + 1,
                    processIndex: i,
                    work: [...work],
                    need: [...need_i],
                    isAllocatable: canAllocate,
                    finish: [...finish],
                    message: ""
                };

                if (canAllocate) {
                    for (let j = 0; j < resourceCount; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = true;
                    safeSequence.push(i);
                    found = true;
                    message += ` P${i} runs, releases resources. New Work = [${work.join(', ')}].`;
                }
                step.message = message;
                steps.push(step);
            }
        }
        if (!found) break; 
        if (++loopCount > processCount * processCount) {
             addLog("Banker's algorithm safety check failed due to excessive loops.", "error");
             break;
        }
    }
    
    const isSafe = safeSequence.length === processCount;
    setBankerResult({ isSafe, sequence: safeSequence, steps });
    addLog(`Banker's Algorithm complete. System is ${isSafe ? 'safe' : 'unsafe'}.`, isSafe ? 'success' : 'error');
    setModal('bankerResult');
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Deadlock Visualization</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
                 <h2 className="text-xl font-semibold mb-4">Controls</h2>
                 <div className="grid grid-cols-2 gap-2">
                     <button onClick={resetSimulation} className="btn-secondary"><RotateCcw size={16} /> Reset</button>
                     <button onClick={handleAddProcess} className="btn-secondary"><Plus size={16} /> Add Process</button>
                     <button onClick={() => setModal('addResource')} className="btn-secondary"><Plus size={16} /> Add Resource</button>
                     <button onClick={() => setModal('request')} className="btn-secondary" disabled={processes.length === 0 || resources.length === 0}><Link size={16} /> Request</button>
                     <button onClick={() => setModal('release')} className="btn-secondary" disabled={allocations.length === 0}><Unlink size={16} /> Release</button>
                     <button onClick={() => setModal('banker')} className="btn-primary col-span-2"><ShieldCheck size={16} /> Banker's Algo</button>
                 </div>
                 {deadlockedInfo.cycles.length > 0 && (
                     <div className="mt-4 p-4 rounded-lg flex items-center gap-3 bg-red-500/10 text-red-500">
                         <AlertTriangle size={24} />
                         <div>
                             <h3 className="font-bold">Deadlock Detected!</h3>
                             <button onClick={() => setModal('resolve')} className="text-sm font-semibold underline hover:text-red-700">Resolve Deadlock</button>
                         </div>
                     </div>
                 )}
            </Card>
             <Card className="p-6">
                 <h2 className="text-xl font-semibold mb-4">Event Log</h2>
                 <div className="h-64 overflow-y-auto space-y-3 text-sm">
                     {log.map(entry => {
                         const Icon = { info: Info, success: CheckCircle, error: XCircle, warning: AlertTriangle, action: Zap }[entry.type];
                         const color = { info: 'text-blue-500', success: 'text-green-500', error: 'text-red-500', warning: 'text-yellow-500', action: 'text-indigo-500' }[entry.type];
                         return (
                            <div key={entry.id} className="flex items-start gap-2">
                                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${color}`} />
                                <div className="flex-grow">
                                    <p className="leading-tight">{entry.message}</p>
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{entry.timestamp}</p>
                                </div>
                            </div>
                        );
                     })}
                 </div>
            </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-4 h-[550px]">
            <h2 className="text-xl font-semibold mb-2">Resource Allocation Graph</h2>
            <div className="h-full w-full">
              <ResourceAllocationGraph 
                processes={processes}
                resources={resources}
                allocations={allocations}
                requests={requests}
                deadlockedNodes={deadlockedInfo.deadlockedNodes}
              />
            </div>
          </Card>
        </div>
      </div>
        {modal === 'addResource' && <AddResourceModal onAdd={handleAddResource} onClose={() => setModal(null)} />}
        {(modal === 'request' || modal === 'release') && (
            <EdgeModal
                type={modal}
                processes={processes}
                resources={resources}
                allocations={allocations}
                onClose={() => setModal(null)}
                onConfirm={modal === 'request' ? handleRequest : handleRelease}
            />
        )}
        {modal === 'banker' && <BankerSetupModal initialState={bankerState} onRun={(state) => { runBanker(state); setModal(null); }} onClose={() => setModal(null)} />}
        {modal === 'bankerResult' && bankerResult && <BankerResultModal result={bankerResult} onClose={() => setModal(null)} />}
        {modal === 'resolve' && (
            <ResolveDeadlockModal
                deadlockedProcesses={Array.from(new Set(deadlockedInfo.cycles.flat()))}
                onClose={() => setModal(null)}
                onResolve={handleResolveDeadlock}
            />
        )}

      <style>{`
        .btn-primary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed; }
        .btn-secondary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed; }
      `}</style>
    </div>
  );
};

export default DeadlockPage;