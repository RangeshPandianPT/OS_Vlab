import React, { useState } from 'react';
import type { Page } from './types';

import Header from './components/Header';
import Footer from './components/Footer';
import SideNav from './components/SideNav';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';

import HomePage from './pages/HomePage';
import CpuSchedulingPage from './pages/CpuSchedulingPage';
import ProcessManagementPage from './pages/ProcessManagementPage';
import MemoryManagementPage from './pages/MemoryManagementPage';
import PageReplacementPage from './pages/PageReplacementPage';
import DiskSchedulingPage from './pages/DiskSchedulingPage';
import ThreadsAndSyncPage from './pages/ThreadsAndSyncPage';
import DeadlockPage from './pages/DeadlockPage';
import ComparisonPage from './pages/ComparisonPage';
import SavedSimulationsPage from './pages/SavedSimulationsPage';
import TopicsPage from './pages/TopicsPage';
import DocsPage from './pages/DocsPage';
import ProgressPage from './pages/ProgressPage';
import { useAuth } from './hooks/useAuth';

type ModalType = 'login' | 'signup' | null;

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { currentUser } = useAuth();

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage setPage={setPage} />;
      case 'cpu-scheduling':
        return <CpuSchedulingPage />;
      case 'process-management':
        return <ProcessManagementPage />;
      case 'memory-management':
        return <MemoryManagementPage />;
      case 'page-replacement':
        return <PageReplacementPage />;
      case 'disk-scheduling':
        return <DiskSchedulingPage />;
      case 'threads-sync':
        return <ThreadsAndSyncPage />;
      case 'deadlocks':
        return <DeadlockPage />;
      case 'comparison':
        return <ComparisonPage />;
      case 'saved-simulations':
        return <SavedSimulationsPage />;
      case 'topics':
        return <TopicsPage setPage={setPage} />;
      case 'docs':
        return <DocsPage />;
      case 'progress':
        return <ProgressPage />;
      default:
        return <HomePage setPage={setPage} />;
    }
  };
  
  const isSimulationPage = ![
    'home', 'topics', 'docs', 'progress', 'comparison', 'saved-simulations'
  ].includes(page);

  return (
    <>
      <div className="flex h-screen flex-col bg-bkg-light dark:bg-bkg-dark text-text-light dark:text-text-dark font-sans">
        <Header 
          setPage={setPage} 
          currentPage={page} 
          openModal={setActiveModal}
          isSimulationPage={isSimulationPage} 
        />
        <div className="flex flex-1 overflow-y-hidden">
          {isSimulationPage && (
            <SideNav 
              currentPage={page} 
              setPage={setPage}
              currentUser={currentUser}
              openModal={setActiveModal}
            />
          )}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className={!isSimulationPage ? 'container mx-auto' : ''}>
              {renderPage()}
            </div>
            <Footer />
          </main>
        </div>
      </div>

      <LoginModal 
        isOpen={activeModal === 'login'} 
        onClose={() => setActiveModal(null)} 
        onSwitchToSignUp={() => setActiveModal('signup')} 
      />
      <SignUpModal 
        isOpen={activeModal === 'signup'} 
        onClose={() => setActiveModal(null)}
        onSwitchToLogin={() => setActiveModal('login')}
      />
    </>
  );
};

export default App;