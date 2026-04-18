import React from 'react';
import type { Page } from '@/types';
import { LogoIcon } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, User, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';

type ModalType = 'login' | 'signup' | null;

interface HeaderProps {
  setPage: (page: Page) => void;
  currentPage: Page;
  openModal: (modal: ModalType) => void;
  isSimulationPage: boolean;
}

const Header: React.FC<HeaderProps> = ({ setPage, currentPage, openModal, isSimulationPage }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-16 bg-panel border-b border-border-dark/40 shadow-card z-50">
      {/* Logo */}
      <button
        onClick={() => setPage('home')}
        className="flex items-center gap-2.5 group"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-card border border-white/20">
          <LogoIcon className="h-5 w-5 text-white" />
        </div>
        <span className="hidden sm:block text-sm font-bold font-mono tracking-widest text-text-primary uppercase">
          OS_VLab
        </span>
      </button>

      {/* Nav links (non-simulation pages) */}
      {!isSimulationPage && (
        <nav className="hidden md:flex items-center gap-1">
          {(['home', 'topics', 'docs', 'progress', 'about'] as Page[]).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all duration-150 ${
                currentPage === p
                  ? 'bg-accent text-accent-fg shadow-card'
                  : 'text-text-muted hover:text-text-primary hover:bg-muted'
              }`}
            >
              {p.replace(/-/g, ' ')}
            </button>
          ))}
        </nav>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {isSimulationPage && (
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wide text-text-muted hover:text-text-primary hover:bg-muted transition-all duration-150"
          >
            <Home size={15} />
            <span className="hidden sm:inline">Home</span>
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-card hover:shadow-pressed active:shadow-pressed transition-all duration-150"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} className="text-text-muted" /> : <Moon size={16} className="text-text-muted" />}
        </button>

        {/* Auth */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background shadow-recessed">
              <User size={14} className="text-text-muted" />
              <span className="text-xs font-mono text-text-muted truncate max-w-[120px]">
                {currentUser.displayName || currentUser.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-card hover:shadow-pressed active:shadow-pressed transition-all duration-150"
              aria-label="Sign out"
            >
              <LogOut size={16} className="text-text-muted" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => openModal('login')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-fg text-xs font-bold font-mono uppercase tracking-wide shadow-card hover:brightness-110 active:shadow-pressed transition-all duration-150 border border-white/20"
          >
            <User size={14} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
