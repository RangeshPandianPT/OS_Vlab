// FIX: Create content for types.ts to define all shared types for the application.
import type { User } from 'firebase/auth';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

// LucideIcon is a more specific type for Lucide icons
export type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

export type Theme = 'light' | 'dark';

export type Page =
  | 'home'
  | 'cpu-scheduling'
  | 'process-management'
  | 'memory-management'
  | 'page-replacement'
  | 'disk-scheduling'
  | 'threads-sync'
  | 'deadlocks'
  | 'comparison'
  | 'saved-simulations'
  | 'topics'
  | 'docs'
  | 'progress';

export interface Module {
  id: Page;
  name: string;
  description: string;
  icon: LucideIcon;
}

export type SchedulingAlgorithm = 
  | 'FCFS' 
  | 'SJF' 
  | 'SRTF' 
  | 'RR' 
  | 'PRIORITY_NP' 
  | 'PRIORITY_P' 
  | 'MLQ';

export interface AlgorithmDetails {
  id: SchedulingAlgorithm;
  name: string;
  shortName: string;
  description: string;
  group: string;
  requiresTimeQuantum?: boolean;
  requiresPriority?: boolean;
}

export interface Process {
  id: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
  completionTime?: number;
  turnaroundTime?: number;
  waitingTime?: number;
}

export interface GanttChartEntry {
  processName: string;
  start: number;
  duration: number;
}

export interface SimulationMetrics {
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  cpuUtilization: number;
}

export interface SimulationResult {
  ganttChart: GanttChartEntry[];
  processMetrics: Process[];
  totalDuration: number;
  metrics: SimulationMetrics;
}

// Memory Management Types
export type MemoryAlgorithm = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT' | 'NEXT_FIT';

export interface MemoryBlock {
  id: number;
  start: number;
  size: number;
  isFree: boolean;
  processId?: number;
}

export interface MemoryProcess {
  id: number;
  name: string;
  size: number;
  blockId: number; // Link to the memory block
}

export interface MemoryMetrics {
  usagePercentage: number;
  externalFragmentation: number; // in KB/units
  allocations: number;
  deallocations: number;
}


export type CurrentUser = User | null;

// Process Management Types
export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export interface SimulatedProcess {
  id: number;
  name: string;
  arrivalTime: number;
  totalBurstTime: number;
  remainingBurstTime: number;
  state: ProcessState;
  cpuTime: number;
  waitingTime: number;
  priority: number;
  color: string;
  completionTime?: number;
  turnaroundTime?: number;
  // For I/O simulation
  ioFrequency: number; 
  ioDuration: number;
  ioCountdown: number;
  // For PCB display
  pc: number;
  registers: { [key: string]: number };
  memoryAddress: number;
}

export type ProcessSimulationMode = 'LIFECYCLE' | 'CONTEXT_SWITCH';


// Deadlock Visualization Types
export interface DeadlockProcessNode {
  id: number;
  name: string;
}

export interface DeadlockResourceNode {
  id: number;
  name: string;
  totalInstances: number;
}

export interface Allocation {
  processId: number;
  resourceId: number;
  instances: number;
}

export interface Request {
  processId: number;
  resourceId: number;
  instances: number;
}

export type DeadlockAlgorithm = 'DETECTION' | 'BANKERS';

export interface BankerState {
    allocation: number[][];
    max: number[][];
    available: number[];
    processCount: number;
    resourceCount: number;
}

export interface BankerStep {
    step: number;
    processIndex: number;
    work: number[];
    need: number[];
    isAllocatable: boolean;
    finish: boolean[];
    message: string;
}

export interface BankerResult {
    isSafe: boolean;
    sequence: number[];
    steps: BankerStep[];
}

// Threads & Synchronization Types
export type SyncSimulationMode =
  | 'MUTEX'
  | 'SEMAPHORE'
  | 'CONDITION_VARIABLE'
  | 'BARRIER'
  | 'READERS_WRITERS'
  | 'DINING_PHILOSOPHERS'
  | 'SLEEPING_BARBER';

export type ThreadState = 
  | 'IDLE' 
  | 'WAITING'
  | 'ACTIVE' 
  | 'BLOCKED' 
  | 'FINISHED'
  // Specific states
  | 'THINKING'
  | 'HUNGRY'
  | 'EATING'
  | 'GETTING_HAIRCUT'
  | 'IN_WAITING_ROOM';

export interface SyncThread {
  id: number;
  name: string;
  state: ThreadState;
  progress: number;
  color: string;
  message: string;
  actionTimer: number;
  // Dining philosophers specific
  leftFork?: number;
  rightFork?: number;
}

export interface SyncMetrics {
    avgWaitTime: number;
    throughput: number;
    lockContention: number;
    deadlocks: number;
    itemsProduced: number;
    itemsConsumed: number;
    customersServed: number;
    customersTurnedAway: number;
    totalAcquisitions: number;
    totalWaits: number;
}

export interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
}