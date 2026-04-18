export type QuestionType = 'multiple-choice' | 'true-false';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // Used for multiple-choice
  correctAnswer: string; // The exact string of the correct option or 'True' / 'False'
  explanation: string;
}

export interface QuizData {
  moduleId: string;
  title: string;
  questions: QuizQuestion[];
}

export const QUIZ_RECORD: Record<string, QuizData> = {
  'cpu-scheduling': {
    moduleId: 'cpu-scheduling',
    title: 'CPU Scheduling',
    questions: [
      {
        id: 'cpu-1',
        type: 'multiple-choice',
        question: 'Which scheduling algorithm is non-preemptive and selects the waiting process with the smallest execution time?',
        options: [
          'First-Come, First-Served (FCFS)',
          'Shortest Job First (SJF)',
          'Round Robin (RR)',
          'Shortest Remaining Time First (SRTF)'
        ],
        correctAnswer: 'Shortest Job First (SJF)',
        explanation: 'SJF selects the process with the smallest burst time next. The standard SJF is non-preemptive, meaning once it starts, it runs to completion.'
      },
      {
        id: 'cpu-2',
        type: 'multiple-choice',
        question: 'What happens to a process in Round Robin scheduling if it does not finish within its time quantum?',
        options: [
          'It is skipped and never finishes.',
          'It is placed back at the tail of the ready queue.',
          'It increases its priority to finish faster next time.',
          'It terminates immediately.'
        ],
        correctAnswer: 'It is placed back at the tail of the ready queue.',
        explanation: 'Round Robin is preemptive. If a process burst exceeds the time quantum, it is interrupted and placed at the back of the ready queue.'
      },
      {
        id: 'cpu-3',
        type: 'true-false',
        question: 'Priority scheduling algorithms can suffer from a problem called starvation.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'In priority scheduling, low-priority processes can wait indefinitely (starvation) if higher-priority processes keep arriving. This is typically solved by aging.'
      },
      {
        id: 'cpu-4',
        type: 'multiple-choice',
        question: 'The Convoy Effect is most commonly associated with which scheduling algorithm?',
        options: [
          'Round Robin (RR)',
          'Shortest Job First (SJF)',
          'First-Come, First-Served (FCFS)',
          'Multilevel Queue (MLQ)'
        ],
        correctAnswer: 'First-Come, First-Served (FCFS)',
        explanation: 'The Convoy Effect happens in FCFS when short processes wait for a very long process to release the CPU, leading to low CPU and I/O utilization.'
      }
    ]
  },
  'disk-scheduling': {
    moduleId: 'disk-scheduling',
    title: 'Disk Scheduling',
    questions: [
      {
        id: 'disk-1',
        type: 'multiple-choice',
        question: 'Which disk scheduling algorithm selects the request with the minimum seek time from the current head position?',
        options: [
          'FCFS',
          'SSTF (Shortest Seek Time First)',
          'SCAN',
          'C-LOOK'
        ],
        correctAnswer: 'SSTF (Shortest Seek Time First)',
        explanation: 'SSTF minimizes the distance the read/write head has to travel from its current point, although it may cause starvation for distant requests.'
      },
      {
        id: 'disk-2',
        type: 'multiple-choice',
        question: 'In the SCAN (Elevator) algorithm, how does the disk head move?',
        options: [
          'It constantly resets to the beginning (cylinder 0).',
          'It services the closest request regardless of direction.',
          'It moves continuously back and forth across the entire disk.',
          'It jumps to random tracks to prevent starvation.'
        ],
        correctAnswer: 'It moves continuously back and forth across the entire disk.',
        explanation: 'Like an elevator, the SCAN algorithm moves the head in one direction until it hits the end, then reverses direction, servicing requests along the way.'
      },
      {
        id: 'disk-3',
        type: 'true-false',
        question: 'C-SCAN provides a more uniform wait time than SCAN by only servicing requests while moving in one direction.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'C-SCAN (Circular SCAN) moves from one end to another servicing requests, then immediately returns to the beginning without servicing requests on the return trip, providing more consistent wait times.'
      }
    ]
  },
  'memory-management': {
    moduleId: 'memory-management',
    title: 'Memory Management',
    questions: [
      {
        id: 'mem-1',
        type: 'multiple-choice',
        question: 'Which allocation strategy searches the entire list of free memory blocks and selects the one that is closest in size to the request?',
        options: [
          'First Fit',
          'Best Fit',
          'Worst Fit',
          'Next Fit'
        ],
        correctAnswer: 'Best Fit',
        explanation: 'Best Fit finds the smallest free partition that is large enough. This minimizes wasted leftover space but is generally slower to search.'
      },
      {
        id: 'mem-2',
        type: 'multiple-choice',
        question: 'What is External Fragmentation?',
        options: [
          'Wasted space inside an allocated block because the request was smaller than the partition.',
          'Total memory space exists to satisfy a request, but it is not contiguous.',
          'When memory is completely full and no processes can load.',
          'When pages are continually swapped in and out of the disk (Trashing).'
        ],
        correctAnswer: 'Total memory space exists to satisfy a request, but it is not contiguous.',
        explanation: 'External fragmentation happens when free memory blocks are broken into small, non-contiguous holes that cannot be used by a new large process.'
      },
      {
        id: 'mem-3',
        type: 'true-false',
        question: 'Paging is a memory management scheme that completely eliminates internal fragmentation.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Paging eliminates external fragmentation, but internal fragmentation can still exist in the last page of a process if the total size is not perfectly divisible by the page size.'
      },
      {
        id: 'mem-4',
        type: 'multiple-choice',
        question: 'Which memory allocation scheme is typically the fastest?',
        options: [
          'Best Fit',
          'First Fit',
          'Worst Fit',
          'Smallest Fit'
        ],
        correctAnswer: 'First Fit',
        explanation: 'First Fit simply scans the list and takes the first available block that is large enough, generally resulting in faster allocation times than Best Fit or Worst Fit.'
      }
    ]
  },
  'threads-sync': {
    moduleId: 'threads-sync',
    title: 'Threads & Synchronization',
    questions: [
      {
        id: 'sync-1',
        type: 'multiple-choice',
        question: 'A mechanism that allows exactly one thread to access a critical section at a time is called a:',
        options: [
          'Counting Semaphore',
          'Mutex (Mutual Exclusion Lock)',
          'Condition Variable',
          'Barrier'
        ],
        correctAnswer: 'Mutex (Mutual Exclusion Lock)',
        explanation: 'A Mutex guarantees mutual exclusion by acting as a binary lock. Only the thread that acquired the Mutex can enter the critical section and release it.'
      },
      {
        id: 'sync-2',
        type: 'true-false',
        question: 'A counting semaphore can be initialized to values greater than 1, allowing multiple threads to access a limited pool of resources.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'A counting semaphore keeps track of available resources. The count decrements as resources are taken and increments as they are released.'
      },
      {
        id: 'sync-3',
        type: 'multiple-choice',
        question: 'What is the "Dining Philosophers" problem primarily meant to illustrate?',
        options: [
          'Process scheduling algorithms in multicore systems.',
          'CPU caching effects.',
          'Deadlock and resource starvation when multiple threads share resources.',
          'The performance difference between user-level and kernel-level threads.'
        ],
        correctAnswer: 'Deadlock and resource starvation when multiple threads share resources.',
        explanation: 'The Dining Philosophers problem highlights issues of deadlock (everyone takes one fork and waits forever) and starvation in concurrent programming.'
      }
    ]
  },
  'process-management': {
    moduleId: 'process-management',
    title: 'Process Management',
    questions: [
      {
        id: 'proc-1',
        type: 'multiple-choice',
        question: 'What is the main difference between a process and a thread?',
        options: [
          'A process is lighter weight than a thread.',
          'A process has its own memory space, whereas threads within a process share the same memory space.',
          'Threads can only run in kernel mode.',
          'There is no difference; they are synonymous.'
        ],
        correctAnswer: 'A process has its own memory space, whereas threads within a process share the same memory space.',
        explanation: 'Processes are independent execution units with their own address spaces. Threads exist within a process and share its resources like memory.'
      },
      {
        id: 'proc-2',
        type: 'multiple-choice',
        question: 'In a process state transition diagram, what state usually follows the "NEW" state?',
        options: [
          'RUNNING',
          'WAITING',
          'READY',
          'TERMINATED'
        ],
        correctAnswer: 'READY',
        explanation: 'Once a process is created (NEW), it is admitted into the system and placed in the READY queue, waiting for CPU assignment.'
      },
      {
        id: 'proc-3',
        type: 'true-false',
        question: 'A context switch involves saving the state of the currently running process and loading the state of the next process.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'During a context switch, the CPU saves all registers and PC of the old process to its PCB and loads the newly scheduled process from its PCB.'
      }
    ]
  },
  'page-replacement': {
    moduleId: 'page-replacement',
    title: 'Page Replacement',
    questions: [
      {
        id: 'pr-1',
        type: 'multiple-choice',
        question: 'Which page replacement algorithm is theoretically perfect but impossible to implement in practice?',
        options: [
          'First-In, First-Out (FIFO)',
          'Least Recently Used (LRU)',
          'Optimal Page Replacement',
          'Clock Algorithm'
        ],
        correctAnswer: 'Optimal Page Replacement',
        explanation: 'The Optimal algorithm replaces the page that will not be used for the longest time in the future, which requires future knowledge.'
      },
      {
        id: 'pr-2',
        type: 'multiple-choice',
        question: 'What is Belady\'s Anomaly?',
        options: [
          'A situation where adding more memory frames increases the number of page faults.',
          'The tendency of pages to become fragmented.',
          'When the system spends more time swapping pages than executing execution.',
          'A CPU scheduling issue.'
        ],
        correctAnswer: 'A situation where adding more memory frames increases the number of page faults.',
        explanation: 'Belady\'s Anomaly occurs in FIFO where giving the process more frames actually results in more page faults instead of fewer.'
      },
      {
        id: 'pr-3',
        type: 'true-false',
        question: 'The LRU algorithm relies on the principle of temporal locality by replacing the page that has not been used for the longest period of time.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'LRU assumes that pages used recently will likely be used again soon, so it evicts the one that hasn\'t been accessed in the longest time.'
      }
    ]
  },
  'deadlocks': {
    moduleId: 'deadlocks',
    title: 'Deadlocks',
    questions: [
      {
        id: 'dl-1',
        type: 'multiple-choice',
        question: 'Which of the following is NOT one of the four necessary conditions for a deadlock?',
        options: [
          'Mutual Exclusion',
          'Hold and Wait',
          'Preemption',
          'Circular Wait'
        ],
        correctAnswer: 'Preemption',
        explanation: 'The four necessary conditions for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.'
      },
      {
        id: 'dl-2',
        type: 'multiple-choice',
        question: 'The Banker\'s Algorithm is a strategy used for:',
        options: [
          'Deadlock Prevention',
          'Deadlock Avoidance',
          'Deadlock Detection',
          'Deadlock Recovery'
        ],
        correctAnswer: 'Deadlock Avoidance',
        explanation: 'The Banker\'s algorithm dynamically avoids deadlock by simulating resource allocation to check for safe states before granting requests.'
      },
      {
        id: 'dl-3',
        type: 'true-false',
        question: 'A circular wait condition can be prevented by defining a linear ordering of all resource types and requiring processes to request them in that order.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'By enforcing a strict ordering, cycles cannot form in the resource allocation graph, thus preventing circular wait.'
      }
    ]
  }
};
