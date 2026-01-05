// Scripts for firebase messaging service worker

// IMPORTANT: push/notification handlers must be registered during initial evaluation.
// We handle WebPush payloads directly here so we don't need env injection in /public.

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    const data = (() => {
        try {
            return event.data ? event.data.json() : null;
        } catch {
            try {
                return event.data ? { body: event.data.text() } : null;
            } catch {
                return null;
            }
        }
    })();

    const notification = data?.notification ?? {};
    const title = notification.title || 'New message';
    const body = notification.body || data?.body || '';

    const url = data?.data?.url || data?.fcmOptions?.link || '/';

    const options = {
        body,
        icon: notification.icon || '/vite.svg',
        image: notification.image,
        data: { url },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification?.data?.url || '/';

    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });
            const existing = allClients.find((c) => c.url && c.url.includes(self.location.origin));
            if (existing) {
                await existing.focus();
                if ('navigate' in existing) {
                    try {
                        await existing.navigate(url);
                    } catch {
                        // ignore
                    }
                }
                return;
            }
            await self.clients.openWindow(url);
        })(),
    );
});
