import React from 'react';
import type { Module, AlgorithmDetails } from './types';
import { Cpu, MemoryStick, Disc, Replace, Users, Lock, GitCompare, Save, Workflow } from 'lucide-react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
    <path d="M2 17l10 5 10-5"></path>
    <path d="M2 12l10 5 10-5"></path>
  </svg>
);

export const MODULES: Module[] = [
  {
    id: 'cpu-scheduling',
    name: 'CPU Scheduling',
    description: 'Visualize how different algorithms decide which process runs next.',
    icon: Cpu,
  },
  {
    id: 'process-management',
    name: 'Process Management',
    description: 'Explore process states, context switching, and inter-process communication.',
    icon: Workflow,
  },
  {
    id: 'memory-management',
    name: 'Memory Management',
    description: 'See how memory is allocated and deallocated for processes.',
    icon: MemoryStick,
  },
  {
    id: 'page-replacement',
    name: 'Page Replacement',
    description: 'Understand page faults and how algorithms replace pages in memory.',
    icon: Replace,
  },
  {
    id: 'disk-scheduling',
    name: 'Disk Scheduling',
    description: 'Watch how disk head movement is optimized to service I/O requests.',
    icon: Disc,
  },
  {
    id: 'threads-sync',
    name: 'Threads & Synchronization',
    description: 'Learn about mutexes, semaphores, and solving concurrency problems.',
    icon: Users,
  },
  {
    id: 'deadlocks',
    name: 'Deadlock Visualization',
    description: 'Detect and resolve deadlocks using algorithms like Banker\'s.',
    icon: Lock,
  },
];

export const OTHER_MODULES: Module[] = [
    {
    id: 'comparison',
    name: 'Comparison Dashboard',
    description: 'Compare the performance of multiple algorithms side-by-side.',
    icon: GitCompare,
  },
  {
    id: 'saved-simulations',
    name: 'Saved Simulations',
    description: 'Access your saved scenarios and simulation results.',
    icon: Save,
  },
];


export const SCHEDULING_ALGORITHMS: AlgorithmDetails[] = [
  { 
    id: 'FCFS', 
    name: 'First-Come, First-Served',
    shortName: 'FCFS',
    description: 'Processes are executed in the order they arrive.',
    group: 'Basic',
  },
  { 
    id: 'SJF',
    name: 'Shortest Job First (Non-preemptive)',
    shortName: 'SJF',
    description: 'The process with the smallest burst time is executed next.',
    group: 'Basic',
  },
  { 
    id: 'SRTF',
    name: 'Shortest Remaining Time First (Preemptive)',
    shortName: 'SRTF',
    description: 'Preemptive version of SJF. Can be interrupted by shorter jobs.',
    group: 'Basic',
  },
  { 
    id: 'RR',
    name: 'Round Robin',
    shortName: 'RR',
    description: 'Each process gets a small unit of CPU time (time quantum).',
    group: 'Basic',
    requiresTimeQuantum: true,
  },
  { 
    id: 'PRIORITY_NP',
    name: 'Priority (Non-preemptive)',
    shortName: 'Priority-NP',
    description: 'The process with the highest priority is executed next.',
    group: 'Priority-Based',
    requiresPriority: true,
  },
  { 
    id: 'PRIORITY_P',
    name: 'Priority (Preemptive)',
    shortName: 'Priority-P',
    description: 'Preemptive version of priority scheduling.',
    group: 'Priority-Based',
    requiresPriority: true,
  },
  { 
    id: 'MLQ',
    name: 'Multilevel Queue',
    shortName: 'MLQ',
    description: 'Partitions the ready queue into several separate queues.',
    group: 'Advanced',
    requiresPriority: true,
  },
];