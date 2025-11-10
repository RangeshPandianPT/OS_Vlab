import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import type { Page } from '../types';
import { Sun, Moon, Menu, X, BookOpen, FileText, BarChart3 } from 'lucide-react';
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
  ];

  return (
    <header className="sticky top-0 z-50 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark flex-shrink-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14 md:h-16">
          <button onClick={() => setPage('home')} className="flex items-center gap-2 text-xl font-bold text-text-light dark:text-text-dark">
            <LogoIcon className="h-7 w-7 md:h-8 md:w-8 text-accent" />
            <span>OS_VLab</span>
          </button>

          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setPage(link.id as Page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-muted-light dark:text-text-muted-dark hover:text-accent dark:hover:text-white'
                  }`}
                >
                  {Icon && <Icon size={16} />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {currentUser ? (
              <UserMenu />
            ) : (
              <>
                <button onClick={() => openModal('login')} className="hidden md:block px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors">
                  Login
                </button>
                <button onClick={() => openModal('signup')} className="hidden md:block px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors">
                  Sign Up
                </button>
              </>
            )}
            <button
              className="md:hidden p-3 rounded-md"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
                        className={`flex items-center gap-3 p-3 rounded-lg text-base font-medium text-left ${
                          isActive
                            ? 'bg-accent/10 text-accent'
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
                    className="flex items-center gap-3 p-3 rounded-lg text-base font-medium text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
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
                  <button onClick={() => { openModal('login'); setIsMenuOpen(false); }} className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors">
                      Login
                  </button>
                  <button onClick={() => { openModal('signup'); setIsMenuOpen(false); }} className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors">
                      Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;