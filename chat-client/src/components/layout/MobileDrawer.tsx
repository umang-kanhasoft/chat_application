import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: string;
    setCurrentView: (view: any) => void;
    userName: string;
    onEditProfile: () => void;
    onManageSkills: () => void;
}

export function MobileDrawer({
    isOpen,
    onClose,
    currentView,
    setCurrentView,
    userName,
    onEditProfile,
    onManageSkills
}: MobileDrawerProps) {

    const { logout } = useAuthStore();

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const navItems = [
        {
            id: 'dashboard', label: 'Dashboard', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            id: 'projects', label: 'Find Work', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'chat', label: 'Messages', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            )
        },
    ];

    const handleLogout = () => {
        logout();
        onClose();
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute top-0 bottom-0 left-0 w-80 bg-white shadow-2xl animate-slide-in flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/orbit_logo.png" alt="Orbit" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold font-display text-gray-900 tracking-tight">Orbit</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    <div className="mb-8">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</div>
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentView(item.id);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${currentView === item.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-8">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Profile</div>
                        {/* We reuse portions of Profile logic here or just a simpler view */}
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center text-white ring-2 ring-white shadow-sm">
                                    <span className="text-sm font-semibold">{userName?.[0]?.toUpperCase() || 'U'}</span>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{userName}</div>
                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Online
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <button
                                    onClick={() => { onEditProfile(); onClose(); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => { onManageSkills(); onClose(); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                    Manage Skills
                                </button>

                                <div className="h-px bg-gray-200 my-1 mx-3"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
