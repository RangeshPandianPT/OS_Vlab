import React from 'react';
import type { MemoryBlock } from '../types';

interface MemoryBarProps {
  blocks: MemoryBlock[];
  totalSize: number;
}

// Function to generate ruler markers, preventing visual clutter
const getRulerMarkers = (blocks: MemoryBlock[], totalSize: number) => {
    const markers = new Set<number>([0, totalSize]);
    blocks.forEach(block => {
        markers.add(block.start);
        markers.add(block.start + block.size);
    });

    const sortedMarkers = Array.from(markers).sort((a, b) => a - b);
    const visibleMarkers: { address: number; label: string }[] = [];
    
    let lastY = -100; // a value that ensures the first label is always added

    sortedMarkers.forEach(address => {
        const currentY = (address / totalSize) * 100;
        // Only add a label if it's more than 7% away from the last one to avoid overlap
        if (currentY > lastY + 7) {
            visibleMarkers.push({ address, label: `${address}` });
            lastY = currentY;
        }
    });

    // Ensure the last marker is always visible if it wasn't added due to proximity
    const lastMarkerIsVisible = visibleMarkers.some(m => m.address === totalSize);
    if (!lastMarkerIsVisible && sortedMarkers.includes(totalSize)) {
      const lastVisibleY = visibleMarkers.length > 0 ? (visibleMarkers[visibleMarkers.length - 1].address / totalSize) * 100 : -100;
      if (100 > lastVisibleY + 7) {
         visibleMarkers.push({ address: totalSize, label: `${totalSize}` });
      }
    }

    return visibleMarkers;
};


const MemoryBar: React.FC<MemoryBarProps> = ({ blocks, totalSize }) => {
  const processColors = [
    '#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899',
    '#6366f1', '#f59e0b', '#d946ef', '#06b6d4', '#22c55e', '#e11d48',
    '#ea580c', '#6d28d9', '#be185d'
  ];

  const rulerMarkers = getRulerMarkers(blocks, totalSize);

  return (
    <div className="w-full h-full flex flex-row gap-4">
        {/* Main Memory Bar */}
        <div className="relative flex-grow h-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
            {blocks.map((block) => {
                const heightPercentage = (block.size / totalSize) * 100;
                const topPercentage = (block.start / totalSize) * 100;

                const color = block.isFree
                    ? 'transparent'
                    : processColors[(block.processId || 0) % processColors.length];

                return (
                    <div
                        key={block.id}
                        className="group absolute w-full flex flex-col items-center justify-center transition-all duration-300 ease-in-out border-b border-gray-400/50 dark:border-gray-500/50 text-white"
                        style={{
                            top: `${topPercentage}%`,
                            height: `${heightPercentage}%`,
                            backgroundColor: color,
                        }}
                    >
                         {!block.isFree && heightPercentage >= 6 && (
                            <div className="text-center text-xs font-semibold leading-tight">
                                <p>P{block.processId}</p>
                                <p>{block.size} KB</p>
                            </div>
                         )}
                         {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-nowrap">
                            {block.isFree ? 'Free Block' : `Process P${block.processId}`}
                            <br />
                            Range: [{block.start} - {block.start + block.size}] KB
                            <br />
                            Size: {block.size} KB
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                        </div>
                    </div>
                );
            })}
        </div>
        
        {/* Vertical Ruler */}
        <div className="relative h-full w-12 flex-shrink-0 text-xs text-text-muted-light dark:text-text-muted-dark">
            <div className="absolute right-0 top-0 h-full w-px bg-gray-400 dark:bg-gray-600"></div>
            {rulerMarkers.map(({ address, label }) => {
                 const topPercentage = (address / totalSize) * 100;
                 return (
                    <div key={address} className="absolute right-px w-full" style={{ top: `${topPercentage}%` }}>
                        <div className="relative w-full text-right pr-1">
                            <span className="absolute -translate-y-1/2" style={{ right: 'calc(100% - 10px)' }}>{label}</span>
                            <div className="absolute right-0 w-2 h-px bg-gray-400 dark:bg-gray-600" style={{ top: 'calc(50% - 0.5px)' }}></div>
                        </div>
                    </div>
                 );
            })}
        </div>
    </div>
  );
};

export default MemoryBar;