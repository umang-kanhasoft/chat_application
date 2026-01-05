import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { config } from '../constants/config';

const firebaseConfig = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId,
    measurementId: config.firebase.measurementId,
};

const app = initializeApp(firebaseConfig);

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Register the Firebase messaging service worker and inject config at runtime.
 * This avoids hardcoding credentials in the public SW file.
 */
export async function registerFirebaseMessagingSW() {
    if (swRegistrationPromise) return swRegistrationPromise;

    swRegistrationPromise = (async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('[SW] Service workers are not supported');
            return null;
        }

        try {
            const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            try {
                await reg.update();
            } catch {
                // ignore
            }
            return await navigator.serviceWorker.ready;
        } catch (err) {
            console.error('[SW] Firebase messaging SW registration failed:', err);
            return null;
        }
    })();

    return swRegistrationPromise;
}

export const requestForToken = async () => {
    try {
        const hasSupport = await isSupported();
        if (!hasSupport) {
            console.log('Firebase Messaging not supported in this browser');
            return null;
        }

        const swRegistration = await registerFirebaseMessagingSW();

        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
            vapidKey: config.firebase.vapidKey,
            serviceWorkerRegistration: swRegistration ?? undefined,
        });

        if (currentToken) {
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export async function subscribeToForegroundMessages(handler: (payload: unknown) => void) {
    const supported = await isSupported();
    if (!supported) return () => {};

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
        handler(payload);
    });
}
