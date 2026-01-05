import { useEffect, useState } from 'react';
import {
    requestForToken,
    subscribeToForegroundMessages,
    registerFirebaseMessagingSW,
} from '../services/firebase';
import { useWebSocket } from './useWebSocket';

export const useNotifications = () => {
    const { registerDevice, isConnected } = useWebSocket();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            await registerFirebaseMessagingSW();
            const currentToken = await requestForToken();
            if (!cancelled && currentToken) {
                console.log('FCM Token retrieved');
                setToken(currentToken);
            }
        };
        void init();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            void Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (token && isConnected) {
            console.log('Registering FCM token with backend');
            registerDevice(token);
        }
    }, [token, isConnected, registerDevice]);

    useEffect(() => {
        let unsub: (() => void) | null = null;

        const setup = async () => {
            unsub = await subscribeToForegroundMessages((payload) => {
                console.log('Foreground message received:', payload);

                // Firebase delivers a shape like { notification: { title, body }, data: {...} }
                const p = payload as {
                    notification?: { title?: string; body?: string; image?: string; icon?: string };
                    data?: Record<string, string>;
                };

                const title = p.notification?.title || 'New message';
                const body = p.notification?.body || '';

                if (!('Notification' in window)) return;
                if (Notification.permission === 'granted') {
                    void new Notification(title, {
                        body,
                        icon: p.notification?.icon,
                        data: p.data,
                    });
                }
            });
        };

        void setup();
        return () => {
            if (unsub) unsub();
        };
    }, []);
};
