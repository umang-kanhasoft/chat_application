import { useEffect, useState } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { SkillsOnboarding } from './components/auth/SkillsOnboarding';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ChatLayout } from './components/layout/ChatLayout';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { useWebSocket } from './hooks/useWebSocket';
import { graphqlFetch } from './services/graphql.service';
import { useAuthStore } from './store/authStore';
import { useConnectionStore } from './store/connectionStore';
import { ConnectionStatus } from './types/chat.types';

type AppView = 'auth' | 'onboarding' | 'dashboard' | 'projects' | 'chat';

function App() {
  const { isAuthenticated, currentUserId, currentUserName, initializeAuth, accessToken } = useAuthStore();
  const { connect, loadProjects, isConnected } = useWebSocket();
  const { status } = useConnectionStore();
  const [currentView, setCurrentView] = useState<AppView>('auth');
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      // Only show restoration loading if we are not already authenticated
      if (!isAuthenticated) {
        setIsRestoringSession(true);
      }
      await initializeAuth();
      setIsRestoringSession(false);
    };
    init();
  }, [initializeAuth, isAuthenticated]);

  // Handle auto-connect on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && currentUserId && !isConnected) {
      connect(currentUserId);
    }
  }, [isAuthenticated, currentUserId, isConnected, connect]);

  // Load projects when authenticated and connected
  useEffect(() => {
    if (isAuthenticated && status === ConnectionStatus.CONNECTED) {
      loadProjects();
    }
  }, [isAuthenticated, status, loadProjects]);

  // Check if user has completed onboarding (has skills)
  useEffect(() => {
    if (isAuthenticated && currentUserId && accessToken && !isCheckingOnboarding) {
      checkOnboardingStatus();
    }
  }, [isAuthenticated, currentUserId, accessToken]);

  const checkOnboardingStatus = async () => {
    setIsCheckingOnboarding(true);
    try {
      const data = await graphqlFetch<{ userSkillsByUserId: Array<{ skill_id: string }> }, { user_id: string }>(
        `query ($user_id: ID!) { userSkillsByUserId(user_id: $user_id) { skill_id } }`,
        { user_id: currentUserId as string }
      );
      const userSkills = data.userSkillsByUserId || [];

      if (userSkills.length > 0) {
        setCurrentView('projects');
      } else {
        setCurrentView('onboarding');
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setCurrentView('onboarding');
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setCurrentView('dashboard');
  };

  // Show connection status banner
  const showConnectionBanner = status === ConnectionStatus.RECONNECTING || status === ConnectionStatus.CONNECTING;

  // Determine what to render
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!accessToken || isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showConnectionBanner && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50 text-sm font-medium">
          {status === ConnectionStatus.RECONNECTING ? '🔄 Reconnecting...' : '🔌 Connecting...'}
        </div>
      )}

      <div className={showConnectionBanner ? 'pt-10' : ''}>
        {/* Navigation Header */}
        {(currentView === 'dashboard' || currentView === 'projects' || currentView === 'chat') && (
          <>
            <div className="fixed top-0 left-0 right-0 glass-white shadow-md z-40">
              {/* Mobile Header */}
              <div className="md:hidden px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
                  FreelanceHub
                </h1>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm">
                    {currentUserName?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
              </div>

              {/* Desktop Header */}
              <div className="hidden md:block">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                      FreelanceHub
                    </h1>
                    <nav className="flex gap-4">
                      <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`px-4 py-2 rounded-lg font-medium smooth-transition ${currentView === 'dashboard'
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                          }`}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => setCurrentView('projects')}
                        className={`px-4 py-2 rounded-lg font-medium smooth-transition ${currentView === 'projects'
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                          }`}
                      >
                        Projects
                      </button>
                      <button
                        onClick={() => setCurrentView('chat')}
                        className={`px-4 py-2 rounded-lg font-medium smooth-transition ${currentView === 'chat'
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                          }`}
                      >
                        Messages
                      </button>
                    </nav>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Welcome, <span className="font-semibold text-gray-900">{currentUserName}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                      {currentUserName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 glass-white border-t border-gray-200 z-50 safe-area-inset-bottom">
              <div className="flex items-center justify-around py-2 px-2">
                <button
                  onClick={() => setCurrentView('projects')}
                  className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg smooth-transition min-h-14 ${currentView === 'projects' ? 'text-primary' : 'text-gray-500'
                    }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-xs font-medium">Projects</span>
                </button>
                <button
                  onClick={() => setCurrentView('chat')}
                  className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg smooth-transition min-h-14 ${currentView === 'chat' ? 'text-primary' : 'text-gray-500'
                    }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs font-medium">Messages</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className={(currentView === 'dashboard' || currentView === 'projects' || currentView === 'chat') ? 'pt-14 md:pt-16 pb-20 md:pb-0' : ''}>
          {currentView === 'onboarding' && currentUserId && (
            <SkillsOnboarding userId={currentUserId} onComplete={handleOnboardingComplete} />
          )}

          {currentView === 'dashboard' && currentUserId && (
            <DashboardPage
              currentUserId={currentUserId}
              onNavigateToProjects={() => setCurrentView('projects')}
            />
          )}

          {currentView === 'projects' && currentUserId && <ProjectsPage currentUserId={currentUserId} />}

          {currentView === 'chat' && (
            <ChatLayout />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
