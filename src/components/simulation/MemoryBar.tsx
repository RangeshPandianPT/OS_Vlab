import React from 'react';
import type { MemoryBlock } from '@/types';

interface MemoryBarProps {
  blocks: MemoryBlock[];
  totalSize: number;
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#ef4444', '#f97316',
];

// Minimum % of total memory a block must occupy for its boundary label to be shown
// Note: Lowered heavily so that every block's boundary is visible, as the container stretches full height now
const MIN_LABEL_PCT = 0;

const MemoryBar: React.FC<MemoryBarProps> = ({ blocks, totalSize }) => {
  if (totalSize === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-text-muted font-mono">
        Set a total memory size to begin.
      </div>
    );
  }

  const usedMemory = blocks.filter(b => !b.isFree).reduce((s, b) => s + b.size, 0);
  const utilization = ((usedMemory / totalSize) * 100).toFixed(1);

  const blockColors: Array<string | null> = [];
  let ci = 0;
  for (const block of blocks) {
    blockColors.push(block.isFree ? null : COLORS[ci++ % COLORS.length]);
  }

  const fmtAddr = (n: number) => `0x${n.toString(16).toUpperCase().padStart(3, '0')}`;

  // Only show a boundary label when the preceding block is tall enough
  // to prevent labels cramming together
  const shouldShowBoundary = (idx: number) => {
    const prevBlock = blocks[idx - 1];
    return prevBlock && (prevBlock.size / totalSize) * 100 >= MIN_LABEL_PCT;
  };

  return (
    <div className="flex h-full gap-5 min-h-0">

      {/* ── Vertical memory bar + address ticks ── */}
      <div className="flex pr-20 flex-shrink-0 h-full">

        {/* Bar — wider box */}
        <div className="flex flex-col w-64 sm:w-80 md:w-96 rounded-xl shadow-recessed border border-white/20 h-full relative z-10 bg-panel">
          {blocks.map((block, idx) => {
            const heightPct = (block.size / totalSize) * 100;
            const displayLabel = shouldShowBoundary(idx);
            
            let cornerClasses = "";
            if (idx === 0) cornerClasses = "rounded-t-xl";
            if (idx === blocks.length - 1) cornerClasses += " rounded-b-xl border-b-0";
            else cornerClasses += " border-b-[2px]";

            const commonClasses = `relative w-full border-background/60 flex items-center justify-center text-xs md:text-sm select-none transition-colors duration-300 ${cornerClasses}`;

            return (
              <div
                key={block.id}
                style={{ flexGrow: block.size, flexBasis: 0, background: block.isFree ? 'transparent' : blockColors[idx]! }}
                className={`${commonClasses} ${block.isFree ? 'text-text-muted/60 bg-muted/10 font-medium' : 'font-black text-white drop-shadow-md shadow-inner'}`}
                title={`${block.isFree ? 'Free' : 'P' + block.processId}: ${block.size} KB @ ${fmtAddr(block.start)}`}
              >
                {heightPct > 4 ? (block.isFree ? (heightPct > 6 ? 'FREE' : '') : `P${block.processId}`) : ''}
                
                {/* Top Address Label (for this block) */}
                {(idx === 0 || displayLabel) && (
                  <div className="absolute top-0 right-0 translate-x-full pl-2 flex items-center gap-1.5 leading-none w-16" style={{ transform: 'translate(100%, -50%)' }}>
                    <span className="w-2 md:w-3 border-t border-text-muted/40" />
                    <span className="text-[9px] md:text-[10px] font-mono text-text-muted">{fmtAddr(block.start)}</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Bottom Address Label (total limit) */}
          <div className="absolute bottom-0 right-0 translate-x-full pl-2 flex items-center gap-1.5 leading-none w-16" style={{ transform: 'translate(100%, 50%)' }}>
            <span className="w-2 md:w-3 border-t border-text-muted/40" />
            <span className="text-[9px] md:text-[10px] font-mono text-text-muted">{fmtAddr(totalSize)}</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: utilization + legend ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">

        {/* Utilization */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-text-muted">
            Used: <span className="text-text-primary font-semibold">{usedMemory} KB</span> / {totalSize} KB
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 shadow-recessed overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${utilization}%` }}
            />
          </div>
          <div className="text-accent text-xs font-bold font-mono">{utilization}% utilized</div>
        </div>

        {/* Block legend */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider flex-shrink-0">Blocks</p>
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-background shadow-recessed flex-shrink-0"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                style={{ background: block.isFree ? 'var(--color-muted, #6b7280)' : blockColors[idx]! }}
              />
              <div className="min-w-0 leading-tight">
                <span className="text-[10px] font-mono font-semibold text-text-primary">
                  {block.isFree ? 'Free' : `P${block.processId}`}
                </span>
                <span className="text-[9px] font-mono text-text-muted ml-1.5">
                  {block.size} KB · {fmtAddr(block.start)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemoryBar;
