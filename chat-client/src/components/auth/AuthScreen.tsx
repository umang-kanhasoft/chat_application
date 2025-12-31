import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { useWebSocket } from '../../hooks/useWebSocket';

export function AuthScreen() {
    const [error, setError] = useState('');
    const { connect, isConnecting } = useWebSocket();

    const { oauthUserId, oauthError } = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return {
            oauthUserId: params.get('userId')?.trim() || '',
            oauthError: params.get('oauthError')?.trim() || '',
        };
    }, []);

    useEffect(() => {
        if (oauthError) {
            setError(oauthError);
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        if (!oauthUserId) return;

        const run = async () => {
            setError('');
            try {
                await connect(oauthUserId);
            } catch {
                setError('Failed to connect. Please try again.');
            } finally {
                window.history.replaceState({}, '', window.location.pathname);
            }
        };

        void run();
    }, [oauthUserId, oauthError, connect]);

    const getApiBaseUrl = () => {
        const configured = (import.meta.env.VITE_API_URL as string | undefined) || '';
        if (configured) return configured.replace(/\/+$/, '');

        const hostname = window.location.hostname;
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//${hostname}:4000`;
    };

    const handleGoogleLogin = () => {
        setError('');
        window.location.href = `${getApiBaseUrl()}/auth/google`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-2">
                        💬 Chat
                    </h1>
                    <p className="text-gray-600">Connect to start messaging</p>
                </div>

                <div className="space-y-5">
                    {error ? <div className="text-sm text-red-600 text-center">{error}</div> : null}

                    <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        isLoading={isConnecting}
                        className="w-full"
                        onClick={handleGoogleLogin}
                    >
                        {isConnecting ? 'Connecting...' : 'Continue with Google'}
                    </Button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Sign in to access the chat</p>
                </div>
            </div>
        </div>
    );
}
