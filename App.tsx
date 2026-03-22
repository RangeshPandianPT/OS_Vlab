import React, { useState, Suspense } from 'react';
import type { Page } from './types';

import Header from './components/Header';
import Footer from './components/Footer';
import SideNav from './components/SideNav';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import AiTutor from './components/AiTutor';

// Keep HomePage eager for fast initial render
import HomePage from './pages/HomePage';

// Lazy load the heavy simulation and secondary pages
const CpuSchedulingPage = React.lazy(() => import('./pages/CpuSchedulingPage'));
const ProcessManagementPage = React.lazy(() => import('./pages/ProcessManagementPage'));
const MemoryManagementPage = React.lazy(() => import('./pages/MemoryManagementPage'));
const PageReplacementPage = React.lazy(() => import('./pages/PageReplacementPage'));
const DiskSchedulingPage = React.lazy(() => import('./pages/DiskSchedulingPage'));
const ThreadsAndSyncPage = React.lazy(() => import('./pages/ThreadsAndSyncPage'));
const DeadlockPage = React.lazy(() => import('./pages/DeadlockPage'));
const ComparisonPage = React.lazy(() => import('./pages/ComparisonPage'));
const SavedSimulationsPage = React.lazy(() => import('./pages/SavedSimulationsPage'));
const TopicsPage = React.lazy(() => import('./pages/TopicsPage'));
const DocsPage = React.lazy(() => import('./pages/DocsPage'));
const ProgressPage = React.lazy(() => import('./pages/ProgressPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
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
      case 'about':
        return <AboutPage />;
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
              <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center p-12">
                  <div className="flex flex-col items-center space-y-4 text-text-muted dark:text-gray-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
                    <p className="text-sm font-medium">Loading module...</p>
                  </div>
                </div>
              }>
                {renderPage()}
              </Suspense>
            </div>
            <Footer currentPage={page} />
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
      <AiTutor currentPage={page} />
    </>
  );
};

export default App;