import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { config } from '../constants/config';

const firebaseConfig = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId,
    measurementId: config.firebase.measurementId
};

const app = initializeApp(firebaseConfig);

export const requestForToken = async () => {
    try {
        const hasSupport = await isSupported();
        if (!hasSupport) {
            console.log('Firebase Messaging not supported in this browser');
            return null;
        }

        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
            vapidKey: config.firebase.vapidKey
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

export const onMessageListener = () => {
    return new Promise((resolve) => {
        isSupported().then(supported => {
            if (supported) {
                const messaging = getMessaging(app);
                import('firebase/messaging').then(({ onMessage }) => {
                    onMessage(messaging, (payload) => {
                        resolve(payload);
                    });
                });
            }
        });
    });
};
