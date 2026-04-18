import React, { useState, Suspense } from 'react';
import type { Page } from '@/types';
import { useAuth } from '@/hooks/useAuth';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SideNav from '@/components/layout/SideNav';
import LoginModal from '@/components/modals/LoginModal';
import SignUpModal from '@/components/modals/SignUpModal';

import { ToastContainer, useToast } from '@/components/shared/Toast';
import { readStateFromUrl, updateUrlPage } from '@/utils/permalinkUtils';

// Keep HomePage eager for fast initial render
import HomePage from '@/pages/HomePage';

// Lazy load the heavy simulation and secondary pages
const CpuSchedulingPage = React.lazy(() => import('@/pages/CpuSchedulingPage'));
const ProcessManagementPage = React.lazy(() => import('@/pages/ProcessManagementPage'));
const MemoryManagementPage = React.lazy(() => import('@/pages/MemoryManagementPage'));
const PageReplacementPage = React.lazy(() => import('@/pages/PageReplacementPage'));
const DiskSchedulingPage = React.lazy(() => import('@/pages/DiskSchedulingPage'));
const ThreadsAndSyncPage = React.lazy(() => import('@/pages/ThreadsAndSyncPage'));
const DeadlockPage = React.lazy(() => import('@/pages/DeadlockPage'));
const SavedSimulationsPage = React.lazy(() => import('@/pages/SavedSimulationsPage'));
const TopicsPage = React.lazy(() => import('@/pages/TopicsPage'));
const DocsPage = React.lazy(() => import('@/pages/DocsPage'));
const ProgressPage = React.lazy(() => import('@/pages/ProgressPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));

type ModalType = 'login' | 'signup' | null;

/** Read initial page from ?page= query param if present */
function getInitialPage(): Page {
  try {
    const { page } = readStateFromUrl();
    if (page) return page;
  } catch { /* ignore */ }
  return 'home';
}

const App: React.FC = () => {
  const [page, setPageState] = useState<Page>(getInitialPage);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  /** Wraps the raw setter to keep the URL ?page= param in sync */
  const setPage = (newPage: Page) => {
    setPageState(newPage);
    updateUrlPage(newPage);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage setPage={setPage} />;
      case 'cpu-scheduling':
        return <CpuSchedulingPage showToast={showToast} />;
      case 'process-management':
        return <ProcessManagementPage />;
      case 'memory-management':
        return <MemoryManagementPage showToast={showToast} />;
      case 'page-replacement':
        return <PageReplacementPage showToast={showToast} />;
      case 'disk-scheduling':
        return <DiskSchedulingPage showToast={showToast} />;
      case 'threads-sync':
        return <ThreadsAndSyncPage />;
      case 'deadlocks':
        return <DeadlockPage showToast={showToast} />;
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
    'home', 'topics', 'docs', 'progress', 'saved-simulations', 'about'
  ].includes(page);

  return (
    <>
      <div className="flex h-screen flex-col bg-background text-text-primary font-sans">
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
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-panel/30">
            <div className={!isSimulationPage ? 'container mx-auto' : ''}>
              <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center p-12">
                  <div className="flex flex-col items-center space-y-4 text-text-muted">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-accent"></div>
                    <p className="text-sm font-bold font-mono tracking-tight">LOADING MODULE...</p>
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default App;