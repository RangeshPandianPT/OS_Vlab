import type { SimulationResult, Process } from '../types';

/**
 * Export simulation results as JSON
 */
export const exportAsJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadFile(blob, `${filename}.json`);
};

/**
 * Export simulation results as CSV
 */
export const exportAsCSV = (result: SimulationResult, filename: string) => {
  const headers = ['Process', 'Arrival Time', 'Burst Time', 'Completion Time', 'Turnaround Time', 'Waiting Time'];
  const rows = result.processMetrics.map(p => [
    p.name,
    p.arrivalTime,
    p.burstTime,
    p.completionTime || 0,
    p.turnaroundTime || 0,
    p.waitingTime || 0
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
    'Metrics',
    `Average Waiting Time,${result.metrics.averageWaitingTime.toFixed(2)}`,
    `Average Turnaround Time,${result.metrics.averageTurnaroundTime.toFixed(2)}`,
    `CPU Utilization,${result.metrics.cpuUtilization.toFixed(2)}%`,
    `Total Duration,${result.totalDuration}`
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
};

/**
 * Export Gantt chart as text representation
 */
export const exportGanttAsText = (result: SimulationResult, filename: string) => {
  const ganttText = [
    'GANTT CHART',
    '=' .repeat(50),
    '',
    ...result.ganttChart.map(entry => 
      `${entry.processName}: ${entry.start} → ${entry.start + entry.duration} (Duration: ${entry.duration})`
    ),
    '',
    '=' .repeat(50),
    'METRICS',
    `Average Waiting Time: ${result.metrics.averageWaitingTime.toFixed(2)}`,
    `Average Turnaround Time: ${result.metrics.averageTurnaroundTime.toFixed(2)}`,
    `CPU Utilization: ${result.metrics.cpuUtilization.toFixed(2)}%`,
    `Total Duration: ${result.totalDuration}`
  ].join('\n');

  const blob = new Blob([ganttText], { type: 'text/plain;charset=utf-8;' });
  downloadFile(blob, `${filename}.txt`);
};

/**
 * Download file helper
 */
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export simulation as PDF (Print-friendly HTML)
 */
export const exportAsPDF = (
  algorithm: string,
  processes: Process[],
  result: SimulationResult,
  timeQuantum?: number
) => {
  // Create a new window with print-friendly content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CPU Scheduling Report - ${algorithm}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            background: white;
            color: #1e293b;
          }
          h1 { color: #2563eb; margin-bottom: 10px; font-size: 32px; }
          h2 { color: #1e293b; margin: 30px 0 15px 0; font-size: 20px; }
          .header-date { color: #64748b; font-size: 14px; margin-bottom: 30px; }
          .config-box { 
            background: #f1f5f9; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
          }
          .config-table { width: 100%; }
          .config-table td { padding: 8px 0; font-size: 14px; }
          .config-table td:first-child { color: #64748b; }
          .config-table td:last-child { font-weight: bold; }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 12px;
            margin-bottom: 30px;
          }
          thead { background: #2563eb; color: white; }
          th { padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          
          .gantt-container { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            overflow-x: auto;
          }
          .gantt-bar { 
            display: inline-block; 
            height: 40px; 
            line-height: 40px; 
            text-align: center; 
            color: white; 
            font-weight: bold; 
            border: 2px solid #1e293b;
            border-radius: 4px;
            margin: 5px 2px;
            vertical-align: top;
          }
          .gantt-label { 
            display: inline-block; 
            font-size: 10px; 
            color: #64748b; 
            text-align: center;
            margin-top: 5px;
          }
          
          .metrics-box { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 25px; 
            border-radius: 8px; 
            color: white;
            margin-bottom: 30px;
          }
          .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin-top: 20px;
          }
          .metric-item { text-align: center; }
          .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
          .metric-label { font-size: 12px; opacity: 0.9; }
          
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e2e8f0; 
            text-align: center; 
            color: #64748b; 
            font-size: 12px; 
          }
          
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .print-btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        
        <h1>CPU Scheduling Simulation Report</h1>
        <p class="header-date">${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}</p>

        <div class="config-box">
          <h2 style="margin-top: 0;">Configuration</h2>
          <table class="config-table">
            <tr>
              <td>Algorithm:</td>
              <td>${algorithm}</td>
            </tr>
            ${timeQuantum ? `
            <tr>
              <td>Time Quantum:</td>
              <td>${timeQuantum}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Number of Processes:</td>
              <td>${processes.length}</td>
            </tr>
            <tr>
              <td>Total Duration:</td>
              <td>${result.totalDuration} time units</td>
            </tr>
          </table>
        </div>

        <h2>Process Table</h2>
        <table>
          <thead>
            <tr>
              <th>Process</th>
              <th style="text-align: center;">Arrival Time</th>
              <th style="text-align: center;">Burst Time</th>
              <th style="text-align: center;">Completion</th>
              <th style="text-align: center;">Turnaround</th>
              <th style="text-align: center;">Waiting</th>
            </tr>
          </thead>
          <tbody>
            ${result.processMetrics.map(p => `
              <tr>
                <td style="font-weight: bold;">${p.name}</td>
                <td style="text-align: center;">${p.arrivalTime}</td>
                <td style="text-align: center;">${p.burstTime}</td>
                <td style="text-align: center;">${p.completionTime || 0}</td>
                <td style="text-align: center;">${p.turnaroundTime || 0}</td>
                <td style="text-align: center;">${p.waitingTime || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Gantt Chart</h2>
        <div class="gantt-container">
          ${result.ganttChart.map((entry, i) => {
            const color = colors[i % colors.length];
            const width = Math.max(60, entry.duration * 40);
            return `
              <div style="display: inline-block; margin-right: 5px;">
                <div class="gantt-bar" style="background: ${color}; width: ${width}px;">
                  ${entry.processName}
                </div>
                <div class="gantt-label" style="width: ${width}px;">
                  ${entry.start} - ${entry.start + entry.duration}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="metrics-box">
          <h2 style="color: white; margin-top: 0;">Performance Metrics</h2>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-value">${result.metrics.averageWaitingTime.toFixed(2)}</div>
              <div class="metric-label">Average Waiting Time</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${result.metrics.averageTurnaroundTime.toFixed(2)}</div>
              <div class="metric-label">Average Turnaround Time</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${result.metrics.cpuUtilization.toFixed(1)}%</div>
              <div class="metric-label">CPU Utilization</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by OS_VLab - Operating System Virtual Laboratory</p>
          <p>Interactive OS Concepts Visualization Platform</p>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};

/**
 * Format date for filename
 */
export const getFormattedDate = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

/**
 * Generate detailed report
 */
export const generateDetailedReport = (
  algorithm: string,
  processes: Process[],
  result: SimulationResult,
  timeQuantum?: number
) => {
  const report = {
    timestamp: new Date().toISOString(),
    algorithm,
    configuration: {
      timeQuantum: timeQuantum || 'N/A',
      processCount: processes.length
    },
    processes: processes.map(p => ({
      name: p.name,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority || 'N/A'
    })),
    results: {
      ganttChart: result.ganttChart,
      processMetrics: result.processMetrics,
      metrics: result.metrics,
      totalDuration: result.totalDuration
    }
  };

  return report;
};
