import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GanttChartEntry } from '../types';

interface GanttChartProps {
  data: GanttChartEntry[];
  totalDuration: number;
}

const GanttChart: React.FC<GanttChartProps> = ({ data, totalDuration }) => {
  const chartHeight = 50;
  // Cyber-Neon palette for Gantt Chart processes
  const colors = [
    'var(--color-neon-blue, #3b82f6)',
    'var(--color-accent, #8b5cf6)',
    '#06b6d4', // neon cyan
    '#f43f5e', // rose
    '#10b981', // emerald
    '#f59e0b', // amber
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
    <div className="w-full overflow-x-auto p-6 bg-card-light dark:bg-card-dark backdrop-blur-xl rounded-2xl border border-border-light dark:border-border-dark shadow-lg">
      <h4 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-accent rounded-full animate-pulse"></span>
        Gantt Chart
      </h4>
      <div className="relative min-w-[700px]">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 inset-y-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px)', 
               backgroundSize: `calc(100% / ${totalDuration || 1}) 100%` 
             }}>
        </div>
        
        <svg width="100%" height={chartHeight + 40} className="relative z-10 overflow-visible">
          {/* Chart Blocks */}
          <AnimatePresence>
            {data.map((entry, index) => {
              const xPos = totalDuration > 0 ? (entry.start / totalDuration) * 100 : 0;
              const width = totalDuration > 0 ? (entry.duration / totalDuration) * 100 : 0;
              const blockColor = processColors.get(entry.processName);
              
              return (
                <g key={`${entry.processName}-${entry.start}-${index}`}>
                  <motion.rect
                    x={`${xPos}%`}
                    y="0"
                    height={chartHeight}
                    rx="8"
                    ry="8"
                    fill={blockColor}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                    className="opacity-90 hover:opacity-100 transition-opacity cursor-crosshair filter drop-shadow-md"
                    initial={{ width: 0, opacity: 0, x: `${xPos-2}%` }}
                    animate={{ width: `${width}%`, opacity: 0.9, x: `${xPos}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  />
                  <motion.text
                    x={`${xPos + width / 2}%`}
                    y={chartHeight / 2}
                    dy=".35em"
                    textAnchor="middle"
                    fill="white"
                    className="font-bold text-sm pointer-events-none drop-shadow-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: (index * 0.1) + 0.3 }}
                  >
                    {entry.processName}
                  </motion.text>
                </g>
              );
            })}
          </AnimatePresence>
          
          {/* Timeline Ticks */}
          {totalDuration > 0 && Array.from({ length: totalDuration + 1 }).map((_, time) => {
             const x = (time / totalDuration) * 100;
              return(
               <g key={time}>
                  <line x1={`${x}%`} y1={chartHeight + 4} x2={`${x}%`} y2={chartHeight + 10} stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-600 truncate"/>
                  <text x={`${x}%`} y={chartHeight + 24} textAnchor="middle" className="text-xs font-medium fill-current text-text-muted-light dark:text-text-muted-dark font-mono truncate">
                      {time}
                  </text>
               </g>
              )
          })}
        </svg>
      </div>
    </div>
  );
};

export default GanttChart;
