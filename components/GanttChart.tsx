
import React from 'react';
import type { GanttChartEntry } from '../types';

interface GanttChartProps {
  data: GanttChartEntry[];
  totalDuration: number;
}

const GanttChart: React.FC<GanttChartProps> = ({ data, totalDuration }) => {
  const chartHeight = 60;
  const colors = [
    '#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899'
  ];
  const processColors = new Map<string, string>();
  let colorIndex = 0;

  data.forEach(entry => {
    if (!processColors.has(entry.processName)) {
      processColors.set(entry.processName, colors[colorIndex % colors.length]);
      colorIndex++;
    }
  });

  return (
    <div className="w-full overflow-x-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
        <h4 className="text-lg font-semibold mb-2">Gantt Chart</h4>
      <svg width="100%" height={chartHeight + 40} className="min-w-[600px]">
        {/* Chart Blocks */}
        {data.map((entry, index) => {
          const x = (entry.start / totalDuration) * 100;
          const width = (entry.duration / totalDuration) * 100;
          return (
            <g key={index}>
              <rect
                x={`${x}%`}
                y="0"
                width={`${width}%`}
                height={chartHeight}
                fill={processColors.get(entry.processName)}
                className="opacity-80"
              />
              <text
                x={`${x + width / 2}%`}
                y={chartHeight / 2}
                dy=".3em"
                textAnchor="middle"
                fill="white"
                className="font-bold text-sm"
              >
                {entry.processName}
              </text>
            </g>
          );
        })}
        {/* Timeline Ticks */}
        {Array.from({ length: totalDuration + 1 }).map((_, time) => {
           const x = (time / totalDuration) * 100;
            return(
             <g key={time}>
                <line x1={`${x}%`} y1={chartHeight} x2={`${x}%`} y2={chartHeight+5} stroke="currentColor" className="text-gray-400"/>
                <text x={`${x}%`} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-current text-text-muted-light dark:text-text-muted-dark">
                    {time}
                </text>
             </g>
            )
        })}
      </svg>
    </div>
  );
};

export default GanttChart;
