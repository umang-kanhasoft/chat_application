import { useEffect, useState, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthScreen } from './components/auth/AuthScreen';
import { SkillsOnboarding } from './components/auth/SkillsOnboarding';
// Lazy loaded components
const DashboardPage = lazy(() =>
    import('./components/dashboard/DashboardPage').then((module) => ({
        default: module.DashboardPage,
    })),
);
const ChatLayout = lazy(() =>
    import('./components/layout/ChatLayout').then((module) => ({ default: module.ChatLayout })),
);
const ProjectsPage = lazy(() =>
    import('./components/projects/ProjectsPage').then((module) => ({
        default: module.ProjectsPage,
    })),
);

import { useWebSocket } from './hooks/useWebSocket';
import { graphqlFetch } from './services/graphql.service';
import { useAuthStore } from './store/authStore';
import { useConnectionStore } from './store/connectionStore';
import { ConnectionStatus } from './types/chat.types';

import { useNotifications } from './hooks/useNotifications';
import { ProfileMenu } from './components/layout/ProfileMenu';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { ManageSkillsModal } from './components/modals/ManageSkillsModal';

type AppView = 'auth' | 'onboarding' | 'dashboard' | 'projects' | 'chat';

const FullScreenLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading...</p>
        </div>
    </div>
);

function App() {
    const { isAuthenticated, currentUserId, currentUserName, initializeAuth, accessToken } =
        useAuthStore();
    const { connect, loadProjects, isConnected } = useWebSocket();
    const { status } = useConnectionStore();
    const [currentView, setCurrentView] = useState<AppView>('auth');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);

    useNotifications();
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
            const data = await graphqlFetch<
                { userSkillsByUserId: Array<{ skill_id: string }> },
                { user_id: string }
            >(`query ($user_id: ID!) { userSkillsByUserId(user_id: $user_id) { skill_id } }`, {
                user_id: currentUserId as string,
            });
            const userSkills = data.userSkillsByUserId || [];

            if (userSkills.length > 0) {
                // If coming from auth/restore, default to dashboard.
                // If explicitly checking, maybe simpler logic:
                if (currentView === 'auth') setCurrentView('dashboard');
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
    const showConnectionBanner =
        status === ConnectionStatus.RECONNECTING || status === ConnectionStatus.CONNECTING;

    // Determine what to render
    if (!isAuthenticated) {
        return <AuthScreen />;
    }

    if (!accessToken || isRestoringSession || isCheckingOnboarding) {
        return <FullScreenLoader />;
    }

    return (
        <>
            {showConnectionBanner && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-60 text-sm font-medium">
                    {status === ConnectionStatus.RECONNECTING
                        ? '🔄 Reconnecting...'
                        : '🔌 Connecting...'}
                </div>
            )}

            <div className={showConnectionBanner ? 'pt-10' : ''}>
                {/* Navigation Header */}
                {(currentView === 'dashboard' ||
                    currentView === 'projects' ||
                    currentView === 'chat') && (
                    <>
                        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
                            {/* Mobile Header */}
                            <div className="md:hidden px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsDrawerOpen(true)}
                                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src="/orbit_logo.png"
                                            alt="Orbit"
                                            className="w-8 h-8 object-contain"
                                        />
                                        <span className="text-xl font-bold tracking-tight text-gray-900 font-display">
                                            Orbit
                                        </span>
                                    </div>
                                </div>
                                {/* Right side empty placeholder */}
                                <div className="w-8"></div>
                            </div>

                            {/* Desktop Header */}
                            <div className="hidden md:block">
                                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                                    <div
                                        className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setCurrentView('dashboard')}
                                    >
                                        <img
                                            src="/orbit_logo.png"
                                            alt="Orbit"
                                            className="w-9 h-9 object-contain drop-shadow-md group-hover:rotate-12 transition-transform duration-500"
                                        />
                                        <span className="text-2xl font-bold tracking-tight text-gray-900 font-display">
                                            Orbit
                                        </span>
                                    </div>
                                    <nav className="flex gap-1">
                                        {[
                                            { id: 'dashboard', label: 'Dashboard' },
                                            { id: 'projects', label: 'Projects' },
                                            { id: 'chat', label: 'Messages' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setCurrentView(item.id as AppView)}
                                                className={`px-4 py-2 rounded-lg font-medium smooth-transition relative overflow-hidden group ${
                                                    currentView === item.id
                                                        ? 'text-primary'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className="relative z-10">{item.label}</span>
                                                {currentView === item.id && (
                                                    <motion.div
                                                        layoutId="nav-pill"
                                                        className="absolute inset-0 bg-primary/10 rounded-lg z-0"
                                                        transition={{
                                                            type: 'spring',
                                                            bounce: 0.2,
                                                            duration: 0.6,
                                                        }}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </nav>
                                    <div className="relative right-6 flex items-center gap-4">
                                        <ProfileMenu
                                            userName={currentUserName || 'User'}
                                            onEditProfile={() => setIsEditProfileOpen(true)}
                                            onManageSkills={() => setIsManageSkillsOpen(true)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Nav Removed */}
                    </>
                )}

                {/* Main Content with Page Transitions */}
                <div
                    className={
                        currentView === 'dashboard' ||
                        currentView === 'projects' ||
                        currentView === 'chat'
                            ? `pt-16 md:pt-20 min-h-screen bg-slate-50 ${currentView !== 'chat' ? 'pb-6 md:pb-0' : ''}`
                            : 'min-h-screen bg-white'
                    }
                >
                    <Suspense fallback={<FullScreenLoader />}>
                        <AnimatePresence mode="wait">
                            {currentView === 'onboarding' && currentUserId && (
                                <motion.div
                                    key="onboarding"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <SkillsOnboarding
                                        userId={currentUserId}
                                        onComplete={handleOnboardingComplete}
                                    />
                                </motion.div>
                            )}

                            {currentView === 'dashboard' && currentUserId && (
                                <motion.div
                                    key="dashboard"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <DashboardPage
                                        currentUserId={currentUserId}
                                        onNavigateToProjects={() => setCurrentView('projects')}
                                    />
                                </motion.div>
                            )}

                            {currentView === 'projects' && currentUserId && (
                                <motion.div
                                    key="projects"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ProjectsPage currentUserId={currentUserId} />
                                </motion.div>
                            )}

                            {currentView === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChatLayout />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Suspense>
                </div>
            </div>

            <MobileDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                currentView={currentView}
                setCurrentView={setCurrentView}
                userName={currentUserName || 'User'}
                onEditProfile={() => setIsEditProfileOpen(true)}
                onManageSkills={() => setIsManageSkillsOpen(true)}
            />

            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
            />

            <ManageSkillsModal
                isOpen={isManageSkillsOpen}
                onClose={() => setIsManageSkillsOpen(false)}
            />
        </>
    );
}

export default App;
