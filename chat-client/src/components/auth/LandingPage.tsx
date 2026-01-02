import { Button } from '../ui/Button';
import { useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import { config } from '../../constants/config';

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

export function LandingPage() {
    const { connect } = useWebSocket();
    const { setOAuthSession } = useAuthStore();
    const [devEmail, setDevEmail] = useState('');
    const [devName, setDevName] = useState('');
    const [devSecret, setDevSecret] = useState('');
    const [devError, setDevError] = useState('');
    const [devLoading, setDevLoading] = useState(false);

    const handleGoogleSignIn = () => {
        const apiBase = (config.apiURL ?? '').trim();
        const url = apiBase ? `${normalizeBaseUrl(apiBase)}/auth/google` : '/auth/google';
        window.location.href = url;
    };

    const handleDevLogin = async () => {
        setDevError('');
        const email = devEmail.trim().toLowerCase();
        if (!email) {
            setDevError('Email is required');
            return;
        }

        const apiBase = (config.apiURL ?? '').trim();
        const url = apiBase ? `${normalizeBaseUrl(apiBase)}/auth/dev-login` : '/auth/dev-login';

        setDevLoading(true);
        try {
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name: devName.trim() || undefined,
                    secret: devSecret.trim() || undefined,
                }),
            });

            const data = (await res.json().catch(() => null)) as
                | { accessToken?: string; user?: { id: string; name: string } ; error?: string }
                | null;

            if (!res.ok) {
                setDevError(data?.error || 'Dev login failed');
                return;
            }

            if (!data?.accessToken || !data.user?.id) {
                setDevError('Dev login failed: missing token');
                return;
            }

            setOAuthSession(data.user.id, data.user.name || 'User', data.accessToken);
            await connect(data.user.id);
        } catch (e) {
            setDevError(e instanceof Error ? e.message : 'Dev login failed');
        } finally {
            setDevLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
                <div className="absolute top-40 right-10 w-48 md:w-72 h-48 md:h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-20 left-1/3 w-48 md:w-72 h-48 md:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative max-w-6xl w-full">
                <div className="glass-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-12 animate-fade-in">
                    {/* Logo and Branding */}
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4">
                            <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                                FreelanceHub
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl lg:text-2xl text-gray-600 font-medium">
                            Where Talent Meets Opportunity
                        </p>
                    </div>

                    {/* Hero Content */}
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-8 md:mb-12">
                        {/* Left Column - Value Proposition */}
                        <div className="space-y-4 md:space-y-6 order-2 md:order-1">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                                Find Your Next Project or Perfect Freelancer
                            </h2>
                            <p className="text-base md:text-lg text-gray-600">
                                Connect with talented professionals, bid on exciting projects, and collaborate seamlessly - all in one platform.
                            </p>

                            {/* Features List */}
                            <div className="space-y-3 md:space-y-4">
                                {[
                                    { icon: '🚀', title: 'Browse Projects', desc: 'Discover opportunities that match your skills' },
                                    { icon: '💼', title: 'Submit Bids', desc: 'Propose your best work and win projects' },
                                    { icon: '💬', title: 'Real-time Chat', desc: 'Collaborate instantly with clients and freelancers' },
                                ].map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-white/50 hover:bg-white smooth-transition">
                                        <span className="text-2xl md:text-3xl shrink-0">{feature.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{feature.title}</h3>
                                            <p className="text-xs md:text-sm text-gray-600">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column - CTA */}
                        <div className="flex flex-col items-center justify-center order-1 md:order-2">
                            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl w-full max-w-md">
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
                                    Get Started Today
                                </h3>
                                <p className="text-sm md:text-base text-gray-600 text-center mb-5 md:mb-6">
                                    Sign in with your Google account to access thousands of projects or find the perfect freelancer.
                                </p>

                                <Button
                                    onClick={handleGoogleSignIn}
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    className="min-h-12"
                                    icon={
                                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                    }
                                >
                                    Continue with Google
                                </Button>

                                {import.meta.env.DEV && (
                                    <div className="mt-6 pt-5 border-t border-gray-200">
                                        <div className="text-sm font-semibold text-gray-900 mb-3">
                                            Dev login (local testing)
                                        </div>

                                        {devError && (
                                            <div className="text-xs text-red-600 mb-3">{devError}</div>
                                        )}

                                        <div className="space-y-3">
                                            <input
                                                value={devEmail}
                                                onChange={(e) => setDevEmail(e.target.value)}
                                                placeholder="email (required)"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <input
                                                value={devName}
                                                onChange={(e) => setDevName(e.target.value)}
                                                placeholder="name (optional)"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <input
                                                value={devSecret}
                                                onChange={(e) => setDevSecret(e.target.value)}
                                                placeholder="secret (optional)"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <Button
                                                onClick={handleDevLogin}
                                                variant="secondary"
                                                size="lg"
                                                fullWidth
                                                className="min-h-12"
                                                disabled={devLoading}
                                            >
                                                {devLoading ? 'Signing in...' : 'Dev Login'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 text-center mt-3 md:mt-4">
                                    By signing in, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 w-full max-w-md">
                                {[
                                    { value: '10K+', label: 'Projects' },
                                    { value: '5K+', label: 'Freelancers' },
                                    { value: '98%', label: 'Satisfaction' },
                                ].map((stat, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="text-xl md:text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                                            {stat.value}
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs md:text-sm text-gray-500 pt-6 md:pt-8 border-t border-gray-200">
                        <p>Trusted by thousands of professionals worldwide</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
