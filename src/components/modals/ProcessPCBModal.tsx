import React from 'react';
import Modal from '@/components/modals/Modal';
import type { SimulatedProcess } from '@/types';
import { Cpu, Clock, Activity, Hash } from 'lucide-react';

interface ProcessPCBModalProps {
  process: SimulatedProcess;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-border-dark/20 last:border-0">
    <span className="text-xs font-bold font-mono uppercase tracking-wide text-text-muted">{label}</span>
    <span className="text-xs font-mono text-text-primary">{value}</span>
  </div>
);

const stateColors: Record<string, string> = {
  NEW:        'bg-blue-500',
  READY:      'bg-green-500',
  RUNNING:    'bg-orange-500',
  WAITING:    'bg-yellow-500',
  TERMINATED: 'bg-red-500',
};

const ProcessPCBModal: React.FC<ProcessPCBModalProps> = ({ process, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title={`PCB — ${process.name}`} maxWidth="max-w-sm">
    <div className="flex flex-col gap-4">
      {/* State badge */}
      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-background shadow-recessed">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${stateColors[process.state] ?? 'bg-gray-400'}`} />
        <span className="text-sm font-bold font-mono tracking-widest uppercase text-text-primary">
          {process.state}
        </span>
      </div>

      {/* PCB fields */}
      <div className="rounded-xl bg-background shadow-recessed px-4 py-1">
        <Row label="PID"              value={process.id} />
        <Row label="Priority"         value={process.priority} />
        <Row label="Arrival Time"     value={process.arrivalTime} />
        <Row label="Total Burst"      value={process.totalBurstTime} />
        <Row label="Remaining Burst"  value={process.remainingBurstTime} />
        <Row label="CPU Time"         value={process.cpuTime} />
        <Row label="Waiting Time"     value={process.waitingTime} />
        {process.completionTime !== undefined && (
          <Row label="Completion Time" value={process.completionTime} />
        )}
        <Row label="Program Counter"  value={`0x${process.pc.toString(16).padStart(4, '0').toUpperCase()}`} />
        <Row label="Memory Address"   value={`0x${process.memoryAddress.toString(16).padStart(4, '0').toUpperCase()}`} />
      </div>

      {/* Registers */}
      <div className="rounded-xl bg-background shadow-recessed p-4">
        <p className="text-xs font-bold font-mono uppercase tracking-widest text-text-muted mb-3">Registers</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {Object.entries(process.registers).map(([reg, val]) => (
            <div key={reg} className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted">{reg}</span>
              <span className="text-xs font-mono text-text-primary">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Modal>
);

export default ProcessPCBModal;
