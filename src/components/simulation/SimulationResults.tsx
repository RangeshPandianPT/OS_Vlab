import React from 'react';
import type { SimulationResult } from '@/types';
import { Card } from '@/components/ui/Card';

interface SimulationResultsProps {
  result: SimulationResult;
}

const PROCESS_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#ef4444', '#f97316',
  '#6366f1', '#14b8a6', '#84cc16', '#a855f7',
];

const getColor = (name: string, allNames: string[]): string => {
  const idx = allNames.indexOf(name);
  return PROCESS_COLORS[idx % PROCESS_COLORS.length];
};

const SimulationResults: React.FC<SimulationResultsProps> = ({ result }) => {
  const { ganttChart, processMetrics, metrics, totalDuration } = result;
  const processNames = [...new Set(ganttChart.map(e => e.processName))];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Waiting Time', value: metrics.averageWaitingTime.toFixed(2), unit: 'ms' },
          { label: 'Avg Turnaround Time', value: metrics.averageTurnaroundTime.toFixed(2), unit: 'ms' },
          { label: 'CPU Utilization', value: metrics.cpuUtilization.toFixed(1), unit: '%' },
        ].map(m => (
          <Card key={m.label} hideDetails className="text-center py-5">
            <p className="text-2xl font-extrabold text-accent">
              {m.value}<span className="text-sm ml-1 font-bold text-text-muted">{m.unit}</span>
            </p>
            <p className="text-xs font-mono uppercase tracking-wide text-text-muted mt-1">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Gantt Chart */}
      <Card hideDetails>
        <h3 className="text-base font-bold text-text-primary mb-4">Gantt Chart</h3>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Bars row */}
            <div className="flex">
              {ganttChart.map((entry, i) => {
                const widthPx = Math.max(40, (entry.duration / totalDuration) * 800);
                const color = getColor(entry.processName, processNames);
                return (
                  <div
                    key={i}
                    style={{ width: `${widthPx}px`, flexShrink: 0, background: color }}
                    className="h-10 flex items-center justify-center text-white text-xs font-bold border-r border-white/20 rounded-sm"
                    title={`${entry.processName}: ${entry.start}→${entry.start + entry.duration}`}
                  >
                    {entry.processName}
                  </div>
                );
              })}
            </div>
            {/* Time markers — each label sits at the LEFT edge of its segment */}
            <div className="flex relative mt-1 mb-3">
              {ganttChart.map((entry, i) => {
                const widthPx = Math.max(40, (entry.duration / totalDuration) * 800);
                return (
                  <div key={i} style={{ width: `${widthPx}px`, flexShrink: 0 }} className="relative">
                    <span className="absolute left-0 -translate-x-1/2 text-[10px] font-mono text-text-muted whitespace-nowrap">
                      {entry.start}
                    </span>
                  </div>
                );
              })}
              {/* End-time label at the right edge of the last bar */}
              <div className="relative w-0">
                <span className="absolute left-0 -translate-x-1/2 text-[10px] font-mono text-text-muted whitespace-nowrap">
                  {totalDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {processNames.map(name => (
              <div key={name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ background: getColor(name, processNames) }}
                />
                <span className="text-xs font-mono text-text-muted">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Process Table */}
      <Card hideDetails>
        <h3 className="text-base font-bold text-text-primary mb-4">Process Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border-dark/30">
                {['Process', 'Arrival', 'Burst', 'Completion', 'Turnaround', 'Waiting'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processMetrics.map(p => (
                <tr key={p.id} className="border-b border-border-dark/20 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-text-primary">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: getColor(p.name, processNames) }}
                      />
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">{p.arrivalTime}</td>
                  <td className="px-4 py-2.5 text-text-muted">{p.burstTime}</td>
                  <td className="px-4 py-2.5 text-text-muted">{p.completionTime ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-muted">{p.turnaroundTime ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-muted">{p.waitingTime ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SimulationResults;
