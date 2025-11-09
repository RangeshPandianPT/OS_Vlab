import React from 'react';
import type { SimulatedProcess } from '../types';
import Modal from './Modal';
import { Cpu, MemoryStick, Hash, Timer, Star, CheckCircle2, XCircle } from 'lucide-react';

interface ProcessPCBModalProps {
  process: SimulatedProcess | null;
  onClose: () => void;
}

const InfoRow: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 text-sm">
        <Icon className="h-5 w-5 text-accent flex-shrink-0" />
        <span className="font-semibold text-text-muted-light dark:text-text-muted-dark w-32">{label}</span>
        <span className="font-mono text-text-light dark:text-text-dark">{value}</span>
    </div>
);

const ProcessPCBModal: React.FC<ProcessPCBModalProps> = ({ process, onClose }) => {
  if (!process) return null;

  return (
    <Modal isOpen={!!process} onClose={onClose} title={`Process Control Block: ${process.name}`}>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow icon={Hash} label="Process ID" value={process.id} />
                <InfoRow icon={Star} label="Priority" value={process.priority} />
                <div className="md:col-span-2">
                     <div className="flex items-center gap-3 text-sm">
                        {/* FIX: Corrected JSX ternary expression syntax. The expression must be wrapped in curly braces and props applied to each component individually. */}
                        {process.state === 'TERMINATED' ? 
                            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" /> : 
                            <XCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        }
                        <span className="font-semibold text-text-muted-light dark:text-text-muted-dark w-32">State</span>
                        <span className="font-semibold px-2 py-0.5 rounded-full text-white text-xs" style={{backgroundColor: process.color}}>{process.state}</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Timer size={18} /> Timing Information</h3>
                <div className="pl-8 space-y-2">
                    <InfoRow icon={Hash} label="Arrival Time" value={`${process.arrivalTime} ticks`} />
                    <InfoRow icon={Hash} label="Total Burst Time" value={`${process.totalBurstTime} ticks`} />
                    <InfoRow icon={Hash} label="Remaining Burst" value={`${process.remainingBurstTime} ticks`} />
                    <InfoRow icon={Hash} label="Waiting Time" value={`${process.waitingTime} ticks`} />
                    <InfoRow icon={Hash} label="Turnaround Time" value={process.turnaroundTime ? `${process.turnaroundTime} ticks` : 'N/A'} />
                    <InfoRow icon={Hash} label="Completion Time" value={process.completionTime ? `${process.completionTime} ticks` : 'N/A'} />
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Cpu size={18} /> CPU Context</h3>
                 <div className="pl-8 space-y-2">
                    <InfoRow icon={Hash} label="Program Counter" value={`0x${process.pc.toString(16).toUpperCase()}`} />
                    <InfoRow icon={Hash} label="CPU Time Used" value={`${process.cpuTime} ticks`} />
                    <div className="flex items-start gap-3 text-sm">
                         <Hash className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                         <span className="font-semibold text-text-muted-light dark:text-text-muted-dark w-32">Registers</span>
                         <div className="font-mono grid grid-cols-2 gap-x-4">
                            {Object.entries(process.registers).map(([reg, val]) => (
                                <span key={reg}>{reg}: {val}</span>
                            ))}
                         </div>
                    </div>
                 </div>
            </div>

             <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><MemoryStick size={18} /> Memory</h3>
                 <div className="pl-8 space-y-2">
                     <InfoRow icon={Hash} label="Memory Address" value={`0x${process.memoryAddress.toString(16).toUpperCase()}`} />
                 </div>
            </div>

             <div className="flex justify-end pt-4">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors">
                    Close
                </button>
             </div>
        </div>
    </Modal>
  );
};

export default ProcessPCBModal;