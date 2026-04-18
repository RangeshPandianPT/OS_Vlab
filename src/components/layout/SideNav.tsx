import React from 'react';
import type { Page } from '@/types';
import type { CurrentUser } from '@/types';
import { MODULES, OTHER_MODULES } from '@/constants';
import { BookOpen, GitCompare, Save, TrendingUp } from 'lucide-react';

type ModalType = 'login' | 'signup' | null;

interface SideNavProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  currentUser: CurrentUser;
  openModal: (modal: ModalType) => void;
}

const SideNav: React.FC<SideNavProps> = ({ currentPage, setPage, currentUser, openModal }) => {
  const allNavItems = [
    ...MODULES,
    ...OTHER_MODULES,
  ];

  return (
    <aside className="flex-shrink-0 w-56 hidden md:flex flex-col bg-panel border-r border-border-dark/40 overflow-y-auto">
      <div className="flex-1 py-4 px-2 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold font-mono tracking-widest text-text-muted uppercase">
          Simulations
        </p>
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => setPage(m.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
              currentPage === m.id
                ? 'bg-background shadow-pressed text-accent'
                : 'text-text-muted hover:bg-background hover:text-text-primary hover:shadow-card'
            }`}
          >
            <m.icon
              size={16}
              className={`flex-shrink-0 ${currentPage === m.id ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'}`}
            />
            <span className="text-xs font-medium truncate">{m.name}</span>
          </button>
        ))}

        <div className="pt-3">
          <p className="px-3 pb-2 text-[10px] font-bold font-mono tracking-widest text-text-muted uppercase">
            Tools
          </p>
          {OTHER_MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setPage(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                currentPage === m.id
                  ? 'bg-background shadow-pressed text-accent'
                  : 'text-text-muted hover:bg-background hover:text-text-primary hover:shadow-card'
              }`}
            >
              <m.icon
                size={16}
                className={`flex-shrink-0 ${currentPage === m.id ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'}`}
              />
              <span className="text-xs font-medium truncate">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom auth prompt */}
      {!currentUser && (
        <div className="p-3 border-t border-border-dark/30">
          <button
            onClick={() => openModal('login')}
            className="w-full py-2 px-3 rounded-lg bg-accent text-accent-fg text-xs font-bold font-mono uppercase tracking-wide shadow-card hover:brightness-110 transition-all duration-150 border border-white/20"
          >
            Sign In to Save
          </button>
        </div>
      )}
    </aside>
  );
};

export default SideNav;
