
import React from 'react';
import Card from '../components/Card';
import type { Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
};

const TOPICS = [
  { id: 'cpu-scheduling', label: 'CPU Scheduling', desc: 'Simulate FCFS, SJF, RR and other CPU scheduling algorithms.' },
  { id: 'process-management', label: 'Process Management', desc: 'Process states, PCB, context switch and lifecycle simulations.' },
  { id: 'memory-management', label: 'Memory Management', desc: 'Paging, allocation strategies and virtual memory.' },
  { id: 'page-replacement', label: 'Page Replacement', desc: 'Simulate LRU, FIFO and OPT page replacement algorithms.' },
  { id: 'disk-scheduling', label: 'Disk Scheduling', desc: 'Compare FCFS, SSTF, SCAN-family and LOOK algorithms.' },
  { id: 'threads-sync', label: 'Threads & Synchronization', desc: 'Mutexes, semaphores and synchronization simulations.' },
  { id: 'deadlocks', label: 'Deadlock Visualization', desc: 'Visualize resource allocation graphs and deadlock detection.' },
];

const TopicsPage: React.FC<Props> = ({ setPage }) => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Topics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPage(t.id as Page)}
            className="text-left"
          >
            <Card className="p-5 hover:shadow-lg transition-shadow w-full">
              <h3 className="text-lg font-semibold">{t.label}</h3>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">{t.desc}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicsPage;