import React from 'react';
import type { Page, CurrentUser } from '../types';
import { MODULES, LogoIcon } from '../constants';
import { User as UserIcon } from 'lucide-react';

interface SideNavProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    currentUser: CurrentUser;
    openModal: (modal: 'login' | 'signup') => void;
}

const SideNav: React.FC<SideNavProps> = ({ currentPage, setPage, currentUser, openModal }) => {
    return (
        <aside className="w-64 flex-shrink-0 bg-card-light/30 dark:bg-card-dark/30 p-4 flex flex-col border-r border-border-light dark:border-border-dark hidden lg:flex">
            <button onClick={() => setPage('home')} className="flex items-center gap-2 px-2 text-xl font-bold text-text-light dark:text-text-dark mb-6 flex-shrink-0">
                <LogoIcon className="h-7 w-7 text-accent" />
                <span>OS_VLab</span>
            </button>
            
            <div className="flex-grow overflow-y-auto">
                <h3 className="px-3 mb-2 text-xs font-semibold uppercase text-text-muted-light dark:text-text-muted-dark tracking-wider">
                    Simulations
                </h3>
                <nav className="flex flex-col gap-1">
                    {MODULES.map((module) => {
                        const isActive = currentPage === module.id;
                        return (
                            <button
                                key={module.id}
                                onClick={() => setPage(module.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-left ${
                                    isActive
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200/60 dark:hover:bg-gray-800/60'
                                }`}
                            >
                                <module.icon size={16} />
                                <span>{module.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark flex-shrink-0">
                {currentUser && (
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="User" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <UserIcon size={16} className="text-text-muted-light dark:text-text-muted-dark" />
                            )}
                        </div>
                        <div className="text-sm overflow-hidden">
                            <p className="font-semibold truncate">{currentUser.displayName || 'User'}</p>
                            <p className="text-text-muted-light dark:text-text-muted-dark truncate">{currentUser.email}</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default SideNav;