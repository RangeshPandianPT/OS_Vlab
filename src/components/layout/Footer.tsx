import React from 'react';
import type { Page } from '@/types';
import { LogoIcon } from '@/constants';

interface FooterProps {
  currentPage: Page;
}

const Footer: React.FC<FooterProps> = ({ currentPage }) => {
  // Don't show footer on simulation pages to keep more screen real estate
  const isSimulationPage = ![
    'home', 'topics', 'docs', 'progress', 'comparison', 'saved-simulations', 'about'
  ].includes(currentPage);

  if (isSimulationPage) return null;

  return (
    <footer className="mt-16 py-8 border-t border-border-dark/30 text-center">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent shadow-card">
            <LogoIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest">OS_VLab</span>
        </div>
        <p className="text-xs">Operating System Virtual Laboratory</p>
        <p className="text-xs opacity-60">Interactive OS Concepts Visualization Platform</p>
      </div>
    </footer>
  );
};

export default Footer;
