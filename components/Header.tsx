import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import type { Page } from '../types';
import { Sun, Moon, Menu, X, BookOpen, FileText, BarChart3, Info } from 'lucide-react';
import { LogoIcon, MODULES } from '../constants';
import UserMenu from './UserMenu';

interface HeaderProps {
  setPage: (page: Page) => void;
  currentPage: Page;
  openModal: (modal: 'login' | 'signup') => void;
  isSimulationPage: boolean;
}

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ setPage, currentPage, openModal, isSimulationPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const navLinks = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="w-full sm:p-4 z-50 sticky top-0 sm:top-2 transition-all duration-300">
      <header className="bg-card-light/70 dark:bg-card-dark/60 backdrop-blur-2xl border border-border-light dark:border-border-dark flex-shrink-0 sm:rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => setPage('home')} className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-accent/20 to-neon-blue/20 dark:from-accent/30 dark:to-neon-cyan/30 group-hover:rotate-12 transition-transform duration-300">
                <LogoIcon className="h-6 w-6 text-accent dark:text-neon-cyan" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight bg-gradient-to-r from-text-light to-text-muted-light dark:from-white dark:to-gray-400 bg-clip-text text-transparent transition-all group-hover:from-accent group-hover:to-neon-blue">
                OS_VLab
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setPage(link.id as Page)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-neon-blue z-0 opacity-100 transition-opacity" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {Icon && <Icon size={16} className={isActive ? "text-white" : "group-hover:scale-110 transition-transform"} />}
                      {link.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {currentUser ? (
                <UserMenu />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => openModal('login')} className="px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark transition-colors border border-border-light dark:border-border-dark">
                    Login
                  </button>
                  <button onClick={() => openModal('signup')} className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-accent to-neon-blue text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all">
                    Sign Up
                  </button>
                </div>
              )}
              <button
                className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border-light dark:border-border-dark">
              {isSimulationPage && (
                <>
                  <h3 className="px-3 mb-2 text-xs font-semibold uppercase text-text-muted-light dark:text-text-muted-dark tracking-wider">
                      Simulations
                  </h3>
                  <nav className="flex flex-col gap-1 mb-4">
                    {MODULES.map((link) => {
                      const isActive = currentPage === link.id;
                      return (
                        <button
                          key={link.id}
                          onClick={() => {
                            setPage(link.id);
                            setIsMenuOpen(false);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl text-base font-medium text-left transition-colors ${
                            isActive
                              ? 'bg-accent/10 text-accent dark:text-neon-cyan'
                              : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <link.icon size={20} />
                          <span>{link.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                  <div className="border-t border-border-light dark:border-border-dark my-2"></div>
                </>
              )}
              <nav className="flex flex-col gap-2">
                 {navLinks.map((link) => {
                   const Icon = link.icon;
                   return (
                    <button
                      key={link.id}
                      onClick={() => {
                        setPage(link.id as Page);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl text-base font-medium text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      {Icon ? <Icon size={20} /> : <div className="w-5"></div>}
                      <span>{link.label}</span>
                    </button>
                   );
                 })}
              </nav>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                {currentUser ? (
                   <UserMenu isMobile />
                ) : (
                  <>
                    <button onClick={() => { openModal('login'); setIsMenuOpen(false); }} className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Login
                    </button>
                    <button onClick={() => { openModal('signup'); setIsMenuOpen(false); }} className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-accent to-neon-blue text-white shadow-md">
                        Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;