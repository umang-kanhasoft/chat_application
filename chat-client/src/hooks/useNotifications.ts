import { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '../services/firebase';
import { useWebSocket } from './useWebSocket';

export const useNotifications = () => {
    const { registerDevice, isConnected } = useWebSocket();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            const currentToken = await requestForToken();
            if (currentToken) {
                console.log('FCM Token retrieved');
                setToken(currentToken);
            }
        };
        fetchToken();
    }, []);

    useEffect(() => {
        if (token && isConnected) {
            console.log('Registering FCM token with backend');
            registerDevice(token);
        }
    }, [token, isConnected, registerDevice]);

    useEffect(() => {
        const unsubscribe = onMessageListener().then(payload => {
            console.log('Foreground message received:', payload);
            // Optional: Helper to show toast if you have a toast system
            // toast.info(payload?.notification?.body);
        });

        return () => {
            // Cleanup
        };
    }, []);
};
