
import React from 'react';
import type { SimulationResult, Process } from '../types';
import Card from './Card';
import GanttChart from './GanttChart';

interface SimulationResultsProps {
  result: SimulationResult;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ result }) => {
  const { ganttChart, metrics, totalDuration, processMetrics } = result;

  const renderMetricsTable = (processes: Process[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 font-medium">Process</th>
            <th className="px-4 py-2 font-medium">Arrival Time</th>
            <th className="px-4 py-2 font-medium">Burst Time</th>
            <th className="px-4 py-2 font-medium">Completion Time</th>
            <th className="px-4 py-2 font-medium">Turnaround Time</th>
            <th className="px-4 py-2 font-medium">Waiting Time</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr key={p.id} className="border-b border-border-light dark:border-border-dark">
              <td className="px-4 py-2 font-bold">{p.name}</td>
              <td className="px-4 py-2">{p.arrivalTime}</td>
              <td className="px-4 py-2">{p.burstTime}</td>
              <td className="px-4 py-2">{p.completionTime}</td>
              <td className="px-4 py-2">{p.turnaroundTime}</td>
              <td className="px-4 py-2">{p.waitingTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Simulation Results</h2>
      
      <div>
        <GanttChart data={ganttChart} totalDuration={totalDuration} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Avg. Waiting Time</p>
            <p className="text-2xl font-bold">{metrics.averageWaitingTime.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Avg. Turnaround Time</p>
            <p className="text-2xl font-bold">{metrics.averageTurnaroundTime.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">CPU Utilization</p>
            <p className="text-2xl font-bold">{metrics.cpuUtilization.toFixed(2)}%</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Process Details</h3>
        {renderMetricsTable(processMetrics)}
      </div>
    </Card>
  );
};

export default SimulationResults;
