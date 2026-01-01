import { useEffect, useMemo, useState } from 'react';
import { LandingPage } from './LandingPage';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';

export function AuthScreen() {
    const [error, setError] = useState('');
    const { connect } = useWebSocket();
    const { setOAuthSession } = useAuthStore();

    const { oauthUserId, oauthUserName, oauthAccessToken, oauthError } = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return {
            oauthUserId: params.get('userId')?.trim() || '',
            oauthUserName: params.get('userName')?.trim() || '',
            oauthAccessToken: params.get('accessToken')?.trim() || '',
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
        if (!oauthAccessToken) {
            setError('Missing access token. Please try logging in again.');
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        const run = async () => {
            setError('');
            try {
                setOAuthSession(oauthUserId, oauthUserName || 'User', oauthAccessToken);
                await connect(oauthUserId);
            } catch {
                setError('Failed to connect. Please try again.');
            } finally {
                window.history.replaceState({}, '', window.location.pathname);
            }
        };

        void run();
    }, [oauthUserId, oauthUserName, oauthAccessToken, oauthError, connect, setOAuthSession]);

    return (
        <div>
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
                    ⚠️ {error}
                </div>
            )}
            <LandingPage />
        </div>
    );
}
