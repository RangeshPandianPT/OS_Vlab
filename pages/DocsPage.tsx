import React, { useCallback, useState } from 'react';
import Card from '../components/Card';

const TOPICS = [
  { id: 'fcfs', label: 'First-Come, First-Served (FCFS)' },
  { id: 'sjf', label: 'Shortest-Job-First (SJF)' },
  { id: 'priority', label: 'Priority Scheduling' },
  { id: 'rr', label: 'Round-Robin (RR)' },
  { id: 'mlq', label: 'Multi-Level Queue (MLQ)' },
  { id: 'process-management', label: 'Process Management' },
  { id: 'process-scheduling', label: 'Process Scheduling & Context Switch' },
  { id: 'ipc', label: 'Interprocess Communication (IPC)' },
  { id: 'disk-scheduling', label: 'Disk Scheduling' },
  { id: 'memory-management', label: 'Memory Management' },
  { id: 'thread-synchronization', label: 'Thread Synchronization' },
  { id: 'deadlocks', label: 'Deadlocks' },
  { id: 'more', label: 'More topics' },
];

const DocsPage: React.FC = () => {
  const [active, setActive] = useState<string>('fcfs');
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        <div className="bg-card-light/30 dark:bg-card-dark/30 p-4 rounded-2xl border border-border-light dark:border-border-dark">
          <h3 className="text-xs font-semibold uppercase text-text-muted-light dark:text-text-muted-dark tracking-wider mb-3">Topics</h3>
          <nav className="flex flex-col gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() => scrollTo(t.id)}
                className={`text-left w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                  active === t.id
                    ? 'bg-accent text-white'
                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="lg:col-span-9 space-y-6">
        <h1 className="text-3xl font-bold">Documentation</h1>

        {/* Render only the active topic to keep the page clean */}
        {active === 'fcfs' && (
          <Card className="p-6" id="fcfs">
            <h2 className="text-2xl font-semibold mb-3">First-Come, First-Served (FCFS) Scheduling</h2>

            <p className="mb-4 text-text-muted-light dark:text-text-muted-dark">
              Explanation: The Waiting Line Approach<br />
              FCFS is the easiest way to schedule a CPU. Just like standing in line, the first process to arrive receives the CPU first. It has a first-in, first-out (FIFO) queuing structure.
            </p>

            <p className="mb-2">
              When a procedure comes in, it moves to the back of the line. The CPU runs the process that is at the front of the queue when it is free. As soon as the first process is done or falls into a waiting state, the following one takes over the CPU.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Key Characteristics</h3>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>
                <strong>Non-preemptive:</strong> Once a process starts running, it can't be stopped until it either finishes or gives up the CPU for I/O or anything else.
              </li>
              <li>
                <strong>Simple to implement:</strong> The operating system only needs to retain a simple ready queue (FIFO).
              </li>
              <li>
                <strong>Fair but not efficient:</strong> Every process has a chance, but when lengthy processes block small ones, everything can slow down.
              </li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">The Convoy Effect</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              When a long-running process (CPU-bound) comes before a bunch of short processes (I/O-bound), all the shorter processes have to wait for no reason. This can slow down the CPU and make the system feel slow or unresponsive.
            </p>

            <p className="mb-3 italic">In real life, imagine a cashier who has to help one customer buy 100 things before helping three customers buy only one thing apiece. The convoy effect means that everyone needs to wait for the initial customer, even though the next ones will be quick.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold">Advantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Very easy to learn and use.</li>
                  <li>Fair in the sense that things are done in the order they come in.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Disadvantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Average wait times are long.</li>
                  <li>Causes the convoy effect.</li>
                  <li>Not ideal for time-sharing systems.</li>
                </ul>
              </div>
            </div>

            <h3 className="mt-6 mb-2 text-xl font-semibold">Simulation Steps for FCFS</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">This simulation lets you observe the non-preemptive nature and the Convoy Effect of FCFS.</p>

            <ol className="list-decimal pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>
                <strong>Define Processes:</strong> For each process provide Arrival Time (time unit when it enters the ready queue) and Burst Time (total CPU time required).
              </li>
              <li>
                <strong>Initialize the System:</strong> Set the system clock/time counter (T) to 0. Initialize the Ready Queue as an empty FIFO queue.
              </li>
              <li>
                <strong>Run Simulation Loop:</strong> At each time unit, add newly arrived processes to the back of the ready queue. When the CPU is free, dequeue the front process and run it to completion (non-preemptive). Advance the clock accordingly and track waiting/turnaround times.
              </li>
              <li>
                <strong>Calculate Metrics:</strong> Compute waiting time, turnaround time and average values after all processes complete.
              </li>
            </ol>

            <h4 className="mt-4 font-semibold">Example Data</h4>
            <p className="text-text-muted-light dark:text-text-muted-dark mt-2">Sample process list to see the convoy effect:</p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 overflow-auto text-sm">
P1 (Arrival=0, Burst=24)
P2 (Arrival=4, Burst=3)
P3 (Arrival=5, Burst=3)
            </pre>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">With FCFS the CPU will run P1 first for the full 24 units and P2/P3 will wait, demonstrating the convoy effect where short jobs are held up by a long job.</p>
          </Card>
        )}

        {active === 'sjf' && (
          <Card className="p-6" id="sjf">
            <h2 className="text-2xl font-semibold mb-3">Shortest-Job-First (SJF) Scheduling</h2>

            <p className="mb-4 text-text-muted-light dark:text-text-muted-dark">
              Explanation: The Optimizing Scheduler<br />
              The algorithm Shortest Job First (SJF) chooses the next process based on how long it takes to use the CPU. The basic purpose of SJF is to keep the average wait time for all the processes in the system as short as possible.
            </p>

            <p className="mb-2">
              It's easy to understand why this works: the system will respond faster overall if we complete shorter jobs first so they don't get buried behind longer ones. SJF is a smarter way to decide what job to complete next, while FCFS just does them in the order they come in.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Characteristics</h3>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>
                <strong>Non-preemptive version:</strong> A process runs until it is done, no matter what.
              </li>
              <li>
                <strong>Preemptive version (SRTF - Shortest Remaining Time First):</strong> The CPU switches to a new process immediately if it has a shorter remaining CPU burst than the one that is presently running.
              </li>
              <li>
                <strong>Optimal (in theory):</strong> SJF gives the smallest average waiting time if the scheduler knows the CPU burst lengths ahead of time.
              </li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Problems and Drawbacks</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              The fundamental problem with SJF is that the operating system doesn't always know when the next CPU burst will finish. It can only guess based on history or prediction algorithms. Also, long processes may suffer starvation if shorter processes keep arriving.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold">Advantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Gives the shortest average waiting time.</li>
                  <li>Works well for batch systems where burst times may be estimated.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Disadvantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Hard to predict exact CPU burst lengths.</li>
                  <li>Can cause starvation of long processes.</li>
                  <li>Not suited for interactive or real-time systems without safeguards.</li>
                </ul>
              </div>
            </div>

            <h3 className="mt-6 mb-2 text-xl font-semibold">Simulation Steps for Preemptive SJF (SRTF)</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">(See the original simulation notes for detailed loop steps.) Generally:</p>
            <ol className="list-decimal pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>Add arriving processes to the ready set, selecting the process with the shortest remaining time to run next.</li>
              <li>If a newly arrived process has shorter remaining time than the currently running one, preempt and switch.</li>
              <li>Continue until all processes complete, tracking waiting and turnaround times.</li>
            </ol>
          </Card>
        )}

        {active === 'priority' && (
          <Card className="p-6" id="priority">
            <h2 className="text-2xl font-semibold mb-3">Priority Scheduling</h2>

            <p className="mb-4 text-text-muted-light dark:text-text-muted-dark">
              Explanation: Valuing Importance<br />
              With priority scheduling, every process is given a priority value. The CPU goes to the process that is most important. In many systems, lower numbers mean higher priority (for example, 1 &gt; 5).
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">How it works</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              A number illustrates how crucial each process is. The scheduler picks the process with the highest priority (usually the lowest number). When two processes share the same priority, FCFS order is used.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Modes of operation</h3>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>
                <strong>Preemptive Priority Scheduling:</strong> If a new process arrives with a higher priority than the currently running one, the CPU immediately switches to the new process so high-priority work runs promptly.
              </li>
              <li>
                <strong>Non-preemptive Priority Scheduling:</strong> Once a process has the CPU it runs until it terminates or waits; a higher-priority process must wait for the CPU to become free.
              </li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Problem — Starvation (Indefinite Blocking)</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              Low-priority processes may never get CPU time if higher-priority processes keep arriving. They can be blocked indefinitely.
            </p>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Solution — Aging</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              Aging prevents starvation by gradually increasing the priority of processes that wait in the ready queue. Over time, a low-priority process will gain high enough priority to run.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold">Advantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Flexible and effective when priorities are well-defined.</li>
                  <li>Useful for systems where certain jobs must be prioritized (e.g., real-time tasks).</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Disadvantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Can lead to starvation of low-priority processes.</li>
                  <li>Determining correct priority values can be difficult and reduce fairness.</li>
                </ul>
              </div>
            </div>

            <h3 className="mt-6 mb-2 text-xl font-semibold">Simulation Steps for Preemptive Priority Scheduling (with Aging)</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">(See original document for detailed loop steps.) In short:</p>
            <ol className="list-decimal pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>Assign priority values to processes when they arrive and add them to the ready queue.</li>
              <li>Select the ready process with the highest priority (lowest number) to run; preempt if a new higher-priority process arrives.</li>
              <li>Apply aging: periodically increase the priority of waiting processes to avoid starvation.</li>
              <li>Track waiting and turnaround times and finish when all processes complete.</li>
            </ol>
          </Card>
        )}

        {active === 'rr' && (
          <Card className="p-6" id="rr">
            <h2 className="text-2xl font-semibold mb-3">Round-Robin (RR) Scheduling</h2>

            <p className="mb-4 text-text-muted-light dark:text-text-muted-dark">
              Explanation: The Time-Shared Slice<br />
              Round Robin (RR) scheduling is a popular approach for time-sharing systems where multiple users or processes share the CPU. Each process receives a fixed time slice (quantum) in a circular order so everyone gets a fair share of CPU time.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">How it works</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              A circular queue keeps all ready processes. The scheduler gives the first process a fixed quantum (e.g., 2ms or 5ms). If the process finishes within the quantum it exits; otherwise it is preempted and placed at the end of the queue. The next process runs for the next quantum. This continues until all processes finish.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Characteristics</h3>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>Preemptive:</strong> Processes are preempted when their time quantum expires.</li>
              <li><strong>Fairness:</strong> Every process gets regular turns at the CPU.</li>
              <li><strong>Good for interactive systems:</strong> Keeps response time bounded for all processes.</li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Advantages</h3>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>Provides fair and responsive service for all processes.</li>
              <li>Prevents starvation — each process eventually receives CPU time.</li>
              <li>Simple and easy to implement with a circular queue.</li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Disadvantages</h3>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>Performance is sensitive to the time quantum choice: too large ≈ FCFS; too small → high context-switch overhead.</li>
              <li>Excessive context switching reduces throughput.</li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Choosing the Time Quantum</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Pick a quantum large enough to allow progress but small enough to keep responsiveness. Typical quanta are between 10–100 ms depending on the system. The right value balances fairness and efficiency.</p>

            <h3 className="mt-6 mb-2 text-xl font-semibold">Simulation Steps for Round-Robin Scheduling</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">(See original doc for detailed steps.) In summary:</p>
            <ol className="list-decimal pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li>Put arriving processes into a circular ready queue.</li>
              <li>Give the front process a time quantum; if it finishes remove it, otherwise preempt and enqueue it at the back.</li>
              <li>Repeat until the queue is empty, tracking waiting/turnaround times.</li>
            </ol>
          </Card>
        )}

        {active === 'mlq' && (
          <Card className="p-6" id="mlq">
            <h2 className="text-2xl font-semibold mb-3">Multi-Level Queue (MLQ) Scheduling</h2>

            <p className="mb-4 text-text-muted-light dark:text-text-muted-dark">
              Explanation: Organizing Processes by Type<br />
              In systems where processes differ (system, interactive, batch), Multilevel Queue Scheduling groups processes into separate queues and applies a tailored scheduling method per queue.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">How it works</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              The ready queue is divided into multiple queues, each for a category of processes. Each queue may use a different scheduling algorithm (e.g., RR for system, Priority or RR for interactive, FCFS for batch). Processes typically do not move between queues in the basic MLQ.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Scheduling between queues</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">
              Two common approaches:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>Fixed Priority Scheduling:</strong> Higher-priority queues are always served first (can starve lower queues).</li>
              <li><strong>Time Slicing Among Queues:</strong> Each queue receives a portion of CPU time (e.g., 70% foreground, 30% background).</li>
            </ul>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Characteristics</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Each queue has its own rules. Queues are set up by priority or allocated time slices. Basic MLQ does not move processes between queues (no mobility).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold">Advantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Organized structure: different process types are handled appropriately.</li>
                  <li>Efficient and predictable handling of high-priority tasks.</li>
                  <li>Each queue can use the best scheduling algorithm for its workload.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Disadvantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Starvation: lower-priority queues may never get CPU if higher queues are busy.</li>
                  <li>Rigid structure: processes can't move between queues even if their behavior changes.</li>
                </ul>
              </div>
            </div>

            <h3 className="mt-6 mb-2 text-xl font-semibold">Real-life analogy</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Like a hospital triage: emergencies are seen first, routine checkups in another queue, and follow-ups in a lower-priority queue.</p>

            <h3 className="mt-6 mb-2 text-xl font-semibold">Notes</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">MLQ is simple and predictable, but if mobility is desired (processes can change class), consider the Multilevel Feedback Queue (MLFQ) which allows processes to move between queues based on their behavior.</p>
          </Card>
        )}

        {active === 'process-management' && (
          <Card className="p-6" id="process-management">
            <h2 className="text-2xl font-semibold mb-3">Process Management</h2>

            <p className="mb-4 text-text-muted-light dark:text-text-muted-dark">
              Process Management is one of the key jobs of an operating system. When multiple programs run at once (foreground and background), the OS must manage them so they run correctly, coordinate, and remain isolated from each other. A <strong>process</strong> is a running instance of a program and includes the program code and all resources used during execution.
            </p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Process Concept</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">A common textbook definition: <em>"A process is a program that is running."</em> A program on disk is static; a process is dynamic and includes the program plus the resources it uses while running.</p>

            <h4 className="mt-3 font-semibold">A process includes:</h4>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>Program code (text segment)</li>
              <li>Program Counter (PC) — next instruction to execute</li>
              <li>Stack — temporary data, function calls, parameters, return addresses</li>
              <li>Data section — global and static variables</li>
              <li>Heap — dynamically allocated memory while running</li>
            </ul>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">Each running process has its own memory space to prevent accidental interference and to protect system stability.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Process States</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">A process moves through different states during its lifetime:</p>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>New:</strong> Process is being created.</li>
              <li><strong>Ready:</strong> Loaded into memory and waiting for CPU time.</li>
              <li><strong>Running:</strong> Instructions are being executed by the CPU.</li>
              <li><strong>Waiting (Blocked):</strong> Waiting for an event (e.g., I/O completion).</li>
              <li><strong>Terminated:</strong> Process has finished execution.</li>
            </ul>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Process Control Block (PCB)</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">The OS maintains a Process Control Block (PCB) for each process — a data structure that serves as the process's identity card and stores all information needed to manage it. When the CPU switches processes, the current PCB is saved and the next process's PCB is loaded.</p>

            <h4 className="mt-3 font-semibold">A PCB typically contains:</h4>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>Process state (ready, running, etc.)</li>
              <li>Program counter (PC)</li>
              <li>CPU registers (to resume execution)</li>
              <li>Scheduling information (priority, queue pointers)</li>
              <li>Memory-management info (page tables, segment tables)</li>
              <li>Accounting info (CPU usage, process ID)</li>
              <li>I/O status info (open files, devices in use)</li>
            </ul>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">The PCB is essential to context switching: saving the outgoing process's PCB and restoring the incoming process's PCB allows execution to resume correctly.</p>
          </Card>
        )}

        {active === 'process-scheduling' && (
          <Card className="p-6" id="process-scheduling">
            <h2 className="text-2xl font-semibold mb-3">Process Scheduling &amp; Context Switch</h2>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Scheduling Queues</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">To efficiently manage multiple processes, the OS organizes them into different queues. As processes execute they move between these queues depending on their state and needs.</p>

            <div className="mb-4">
              <div className="mb-2 font-semibold">Queue Type</div>
              <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
                <li>
                  <strong>Job Queue:</strong> Contains all processes in the system (both ready and waiting).
                </li>
                <li>
                  <strong>Ready Queue:</strong> Contains all processes that are loaded in main memory and waiting for CPU execution.
                </li>
                <li>
                  <strong>Device Queue:</strong> Contains processes waiting for a specific I/O device (like a printer or disk).
                </li>
              </ul>
            </div>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">As processes execute they move between these queues — from ready to waiting (when performing I/O), and from waiting back to ready when the event completes. Proper scheduling ensures CPU time is allocated efficiently while keeping I/O and CPU-bound processes balanced.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Context Switch</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">A context switch occurs when the CPU switches from executing one process to another. The OS saves the state of the outgoing process in its Process Control Block (PCB) and loads the saved state of the incoming process from its PCB so it can resume correctly.</p>

            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark mb-3">
              <li>The operating system stores the running process's state (registers, program counter, etc.) in its PCB when it is preempted or blocked.</li>
              <li>The CPU retrieves the next process's information from its PCB to begin or resume execution.</li>
              <li>Context switching enables multitasking and lets each process continue where it left off, but during the switch the system isn't doing useful application work — it is overhead.</li>
            </ul>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Because context switches consume CPU cycles (saving/restoring registers, updating memory mappings, flushing TLBs in some architectures), good scheduling aims to minimize unnecessary switches while still meeting responsiveness and fairness goals.</p>

            <h4 className="mt-3 font-semibold">Quick notes</h4>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>Context switches are required for preemptive scheduling and for handling I/O/blocking events.</li>
              <li>Excessive context-switching (very small quanta or too-frequent preemption) reduces throughput and increases overhead.</li>
              <li>Balanced scheduling chooses quanta and policies that trade off responsiveness with the overhead of switching.</li>
            </ul>
          </Card>
        )}

        {active === 'ipc' && (
          <Card className="p-6" id="ipc">
            <h2 className="text-2xl font-semibold mb-3">Interprocess Communication (IPC)</h2>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Cooperating processes frequently need to exchange data or coordinate their actions — for example, a text editor and a spell checker working together. The OS provides Interprocess Communication (IPC) mechanisms so processes can communicate and stay in sync.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Two Models of IPC</h3>

            <h4 className="mt-2 font-semibold">1. Shared Memory</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">A region of memory is mapped into the address space of two or more processes so they can read and write it directly. After the kernel sets up the shared segment, processes access it without kernel mediation — which makes it very fast. Because multiple writers/readers may touch the same data concurrently, proper synchronization (semaphores, mutexes) is required to avoid race conditions.</p>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark"><strong>Example:</strong> In the producer-consumer problem, a producer writes items into a shared buffer and the consumer reads them. Semaphores or mutexes ensure producers don't overwrite unread data and consumers don't read empty slots.</p>

            <h4 className="mt-2 font-semibold">2. Message Passing</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Processes exchange data by explicitly sending and receiving messages through OS-provided calls (e.g., send(message), receive()). This model is easier to use across distributed systems (processes on different machines) and provides isolation since memory is not shared directly. It tends to be slower than shared memory due to kernel involvement and copying, but is often safer and simpler to reason about.</p>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark"><strong>Example:</strong> A client process sends a request message to a server process asking for data; the server processes the request and sends back a reply message.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Summary</h3>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li><strong>Shared Memory</strong> — faster, but requires careful synchronization (semaphores/mutexes) to avoid race conditions.</li>
              <li><strong>Message Passing</strong> — simpler and better suited for distributed systems; safer because memory isn't shared directly, but typically slower.</li>
            </ul>
          </Card>
        )}

        {active === 'disk-scheduling' && (
          <Card className="p-6" id="disk-scheduling">
            <h2 className="text-2xl font-semibold mb-3">Disk Scheduling</h2>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Disk scheduling organizes disk I/O requests so they can be handled efficiently. Moving the disk head (seek time) is the slowest part of I/O. The primary goals are to minimize seek time and maximize throughput (requests completed per second).</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">9 — Disk Scheduling Algorithms (Overview)</h3>

            <h4 className="mt-3 font-semibold">1. First-Come, First-Served (FCFS)</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Requests are processed in arrival order. Very simple and fair, but can be inefficient: a request far from the current head position may cause long head travel and high average seek time.</p>

            <h4 className="mt-3 font-semibold">2. Shortest Seek Time First (SSTF)</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Selects the request closest to the current head position, reducing total head movement. Similar in spirit to SJF for CPU scheduling. Reduces head movement but may cause starvation for distant requests if nearby requests keep arriving.</p>

            <h4 className="mt-3 font-semibold">3. SCAN (Elevator Algorithm)</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">The disk arm moves in one direction servicing requests until it reaches the end, then reverses direction and continues. Provides fairness because every request in the path gets serviced eventually — analogy: an elevator moving up and down.</p>

            <h4 className="mt-3 font-semibold">4. C-SCAN (Circular SCAN)</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Like SCAN but the head only moves in one direction; when it reaches the end it jumps back to the start without servicing requests on the return. Provides more uniform wait times and improved fairness — like a one-way bus route.</p>

            <h4 className="mt-3 font-semibold">5. LOOK and C-LOOK</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Variants of SCAN/C-SCAN: the head only goes as far as the last request in a direction rather than traveling to the absolute end. LOOK reverses direction when there are no more requests ahead; C-LOOK jumps back only as far as the first request on the other side. These avoid unnecessary head movement and are more efficient in practice.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Notes and Trade-offs</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Choosing the right algorithm depends on workload: FCFS is simple but can have high seek times; SSTF and SCAN-family algorithms aim to reduce head movement at the cost of potential starvation or complexity. LOOK/C-LOOK are practical optimizations to avoid extra travel. Overall, good disk scheduling reduces average seek time and increases throughput.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold">Advantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>Reduces average seek time when using SSTF/SCAN/LOOK variants.</li>
                  <li>SCAN-family provides fairness and better worst-case behavior than SSTF.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Disadvantages</h4>
                <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
                  <li>FCFS leads to high average seek time.</li>
                  <li>SSTF can starve distant requests.</li>
                  <li>SCAN/C-SCAN add complexity and may still need tuning depending on head movement patterns.</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {active === 'memory-management' && (
          <Card className="p-6" id="memory-management">
            <h2 className="text-2xl font-semibold mb-3">Memory Management</h2>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Memory Management is the part of the OS that tracks and arranges physical memory, decides how much memory to give each process, and ensures isolation and efficient reuse. The primary goals are maximizing memory utilization and protecting processes from each other for stability and security.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Logical vs. Physical Address Space</h3>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Each process sees a virtual or logical address space — an abstraction that makes it appear to have its own contiguous memory. The logical (virtual) address is generated by the CPU during execution. The physical address is the real location in RAM.</p>

            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">The Memory Management Unit (MMU) in hardware translates logical addresses to physical addresses at runtime. This enables virtual memory, allowing processes to use more apparent memory than physically present by paging swapped pages to disk.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Contiguous Memory Allocation</h3>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Contiguous allocation gives each process one continuous block of memory. It's simple to implement and quick to compute addresses, but it suffers from fragmentation.</p>

            <h4 className="mt-2 font-semibold">Fixed Partitioning</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Memory is split into fixed-size partitions. Easy but causes internal fragmentation (wasted space inside an allocated partition).</p>

            <h4 className="mt-2 font-semibold">Variable Partitioning</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Partitions are sized to fit processes as they arrive. More flexible, but leads to external fragmentation (free holes scattered between allocated blocks).</p>

            <h4 className="mt-3 font-semibold">Hole Allocation Strategies</h4>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>First Fit:</strong> Allocate the first hole that's big enough — fast but can waste space quickly.</li>
              <li><strong>Best Fit:</strong> Allocate the smallest hole that fits — minimizes wasted space but requires a full search and can be slower.</li>
              <li><strong>Worst Fit:</strong> Allocate the largest hole — leaves large gaps but can result in poor overall utilization.</li>
            </ul>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">If external fragmentation becomes severe, the OS can perform compaction (moving processes to coalesce free space) — but compaction is time-consuming.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Paging</h3>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Paging eliminates external fragmentation by dividing physical memory into fixed-size frames and logical memory into pages of the same size. The OS keeps a Page Table that maps each page to a frame. When the CPU generates a logical address, the MMU uses the page table to compute the physical address.</p>

            <h4 className="mt-2 font-semibold">Translation Lookaside Buffer (TLB)</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">To speed up translation, hardware caches recent page→frame mappings in the TLB. A TLB hit yields almost-instant translation. On a TLB miss, the system must consult the page table in memory, which is slower.</p>

            <h4 className="mt-3 font-semibold">Advantages of Paging</h4>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>No external fragmentation.</li>
              <li>Efficient use of memory.</li>
              <li>Enables virtual memory through demand paging.</li>
            </ul>

            <h4 className="mt-3 font-semibold">Disadvantages</h4>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark mt-2">
              <li>Address translation overhead (extra memory accesses unless cached in TLB).</li>
              <li>Internal fragmentation within pages (unused space at end of a page).</li>
            </ul>
          </Card>
        )}

        {active === 'thread-synchronization' && (
          <Card className="p-6" id="thread-synchronization">
            <h2 className="text-2xl font-semibold mb-3">Thread Synchronization</h2>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">When multiple processes or threads run concurrently and access the same data or resources, synchronization ensures accesses are ordered and consistent. Without synchronization, shared data can become corrupt or inconsistent.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">The Critical-Section Problem</h3>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">The critical section is the portion of code where a process accesses shared resources. The critical-section problem is designing a protocol so that only one process executes its critical section at a time while allowing concurrency elsewhere.</p>

            <h4 className="mt-2 font-semibold">Requirements for a Correct Solution</h4>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>Mutual Exclusion</strong> — Only one process may be in its critical section at a time.</li>
              <li><strong>Progress</strong> — If no process is in the critical section, the selection of the next process to enter cannot be postponed indefinitely.</li>
              <li><strong>Bounded Waiting</strong> — There must be a limit on how long a process waits before entering its critical section (prevents starvation).</li>
            </ul>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Synchronization Tools</h3>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Operating systems and libraries provide primitives to coordinate access to shared resources. Two common primitives are mutex locks and semaphores.</p>

            <h4 className="mt-2 font-semibold">A. Mutex Locks</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">A mutex (mutual-exclusion lock) allows at most one thread to hold the lock. A thread must acquire the mutex before entering the critical section and release it afterward. If a thread tries to acquire a held mutex, it blocks until the lock is released. Mutexes are suitable for short critical sections but can cause deadlocks if used improperly (e.g., circular locking).</p>

            <h4 className="mt-2 font-semibold">B. Semaphores</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">A semaphore is an integer accessed only through two atomic operations:</p>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>wait(S) / P</strong> — decrement S; if S becomes negative the caller blocks.</li>
              <li><strong>signal(S) / V</strong> — increment S; if there are waiting processes one is unblocked.</li>
            </ul>

            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Types of semaphores:</p>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>Counting Semaphore</strong> — controls access to a finite number of identical resources.</li>
              <li><strong>Binary Semaphore</strong> — values 0 or 1; behaves like a mutex.</li>
            </ul>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">Semaphores are flexible but must be used carefully to avoid deadlocks, missed signals, or priority inversion.</p>

            <h3 className="mt-4 mb-2 text-lg font-semibold">Conclusion</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark">Synchronization primitives like mutexes and semaphores keep concurrent systems consistent. They regulate access to shared data, prevent race conditions, and help keep multi-threaded and multi-process environments stable and correct.</p>
          </Card>
        )}

        {active === 'deadlocks' && (
          <Card className="p-6" id="deadlocks">
            <h2 className="text-2xl font-semibold mb-3">Deadlocks</h2>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Deadlock Concept</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">A deadlock occurs when a group of processes are each waiting for resources held by others in the group. Each process holds at least one resource and waits for another; none can proceed, and the system stops making progress.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Coffman Conditions</h3>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Four necessary conditions must hold simultaneously for a deadlock to occur:</p>
            <ul className="list-disc pl-5 space-y-2 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>Mutual Exclusion:</strong> At least one resource must be held in a non-shareable mode.</li>
              <li><strong>Hold and Wait:</strong> A process holds at least one resource and is waiting to acquire additional resources held by others.</li>
              <li><strong>No Preemption:</strong> Resources cannot be forcibly taken away; they must be released voluntarily by the holding process.</li>
              <li><strong>Circular Wait:</strong> A circular chain exists where each process holds a resource needed by the next process in the cycle.</li>
            </ul>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">Breaking any one of these conditions prevents deadlock.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Deadlock Prevention</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Prevention eliminates one or more Coffman conditions so deadlocks cannot occur. Common approaches include:</p>

            <h4 className="mt-2 font-semibold">Eliminating Hold and Wait</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Require processes to request all needed resources at once (or release all before requesting new ones). This prevents processes from holding resources while waiting for others, though it can reduce parallelism and resource utilization.</p>

            <h4 className="mt-2 font-semibold">Eliminating No Preemption</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Allow the system to preempt resources: if a process requests a resource that cannot be granted, preempt some resources from that process and give them to others. This only works for resources that can be safely saved and restored.</p>

            <h4 className="mt-2 font-semibold">Eliminating Circular Wait</h4>
            <p className="mb-2 text-text-muted-light dark:text-text-muted-dark">Impose an ordering on resource types and require processes to request resources in order. This prevents circular chains from forming.</p>

            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Prevention is effective but can be restrictive and reduce concurrency.</p>

            <h3 className="mt-4 mb-2 text-xl font-semibold">Deadlock Avoidance — Banker’s Algorithm</h3>
            <p className="mb-3 text-text-muted-light dark:text-text-muted-dark">Avoidance algorithms allow requests dynamically but only grant them if the resulting system state is safe. The Banker’s Algorithm treats the OS like a banker: processes declare their maximum needs in advance, and the OS simulates allocations to ensure the system remains in a safe state before granting requests.</p>

            <h4 className="mt-2 font-semibold">Key Data Structures</h4>
            <ul className="list-disc pl-5 text-text-muted-light dark:text-text-muted-dark">
              <li><strong>Available:</strong> Vector of currently available resource instances.</li>
              <li><strong>Max:</strong> Matrix specifying each process’s maximum demand.</li>
              <li><strong>Allocation:</strong> Matrix of resources currently allocated to processes.</li>
              <li><strong>Need:</strong> Matrix computed as Need = Max − Allocation, showing remaining requirements.</li>
            </ul>

            <p className="mt-3 text-text-muted-light dark:text-text-muted-dark">The algorithm checks whether granting a request keeps the system in a safe state (one where all processes can finish in some order). If not safe, the request is denied and the process must wait. Avoidance gives better utilization than prevention but requires advance knowledge of maximum needs and extra computation for safety checks.</p>
          </Card>
        )}

        {active === 'more' && (
          <Card className="p-6" id="more">
            <h3 className="text-xl font-semibold mb-2">More topics (coming soon)</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark">Other scheduling algorithms and OS concepts will be added here. Use the left navigation to jump between topics.</p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DocsPage;