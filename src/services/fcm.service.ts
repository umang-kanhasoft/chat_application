import firebase, { ServiceAccount } from 'firebase-admin';
import { getLogger } from '../config/logger';
import UserDevice from '../models/UserDevice';
import { config } from '../config/config';

const log = getLogger('fcm.service');

// Initialize Firebase Admin SDK
// You should verify if the app is already initialized to avoid errors
if (firebase.apps.length === 0) {
    try {
        firebase.initializeApp({
            // credential: firebase.credential.applicationDefault(),
            // Or use service account:
            credential: firebase.credential.cert({ ...config.firebase as ServiceAccount }),
        });
        log.info('Firebase Admin initialized');
    } catch (error) {
        log.warn({ err: error }, 'Failed to initialize Firebase Admin, notifications will not work');
    }
}

class FcmService {
    /**
     * Send a notification to a specific user's registered devices
     */
    async sendNotification(
        userId: string,
        payload: {
            title: string;
            body: string;
            data?: Record<string, string>;
            imageUrl?: string;
        },
    ) {
        try {
            const devices = await UserDevice.findAll({
                where: { userId },
            });

            if (devices.length === 0) {
                return;
            }

            const tokens = devices.map((d) => d.fcmToken);

            // Remove duplicates just in case
            const uniqueTokens = [...new Set(tokens)];

            const message: firebase.messaging.MulticastMessage = {
                tokens: uniqueTokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.imageUrl,
                },
                data: payload.data,
                // Web specific config
                webpush: {
                    fcmOptions: {
                        link: payload.data?.url || '/',
                    },
                },
                // Android specific config
                android: {
                    notification: {
                        priority: 'high',
                    },
                },
            };

            const response = await firebase.messaging().sendEachForMulticast(message);

            // Handle invalid tokens (cleanup)
            if (response.failureCount > 0) {
                const tokensToDelete: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const error = resp.error;
                        if (
                            error?.code === 'messaging/invalid-registration-token' ||
                            error?.code === 'messaging/registration-token-not-registered'
                        ) {
                            tokensToDelete.push(uniqueTokens[idx]);
                        }
                    }
                });

                if (tokensToDelete.length > 0) {
                    await UserDevice.destroy({
                        where: {
                            fcmToken: tokensToDelete,
                        },
                    });
                }
            }

            log.info({ successCount: response.successCount, failureCount: response.failureCount }, 'Sent FCM notifications');
        } catch (error) {
            log.error({ err: error, userId }, 'Error sending FCM notification');
        }
    }

    /**
     * Register a new device token for a user
     */
    async registerDevice(userId: string, token: string, platform: 'web' | 'android' | 'ios' = 'web') {
        try {
            await UserDevice.upsert({
                userId,
                fcmToken: token,
                platform,
                lastActive: new Date(),
            });
        } catch (error) {
            log.error({ err: error, userId }, 'Error registering device token');
            throw error;
        }
    }

    /**
     * Unregister a device token
     */
    async unregisterDevice(token: string) {
        try {
            await UserDevice.destroy({
                where: { fcmToken: token },
            });
        } catch (error) {
            log.error({ err: error }, 'Error unregistering device token');
        }
    }
}

export default new FcmService();
