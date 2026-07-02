import { notificationApi } from '../api/notificationApi';

const PUSH_REGISTERED_KEY = 'innerg_push_registered';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function registerWebPush() {
    if (!isPushSupported()) {
        return { success: false, reason: 'unsupported' };
    }

    if (Notification.permission === 'denied') {
        return { success: false, reason: 'denied' };
    }

    if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, reason: 'denied' };
        }
    }

    const publicKey = await notificationApi.getVapidPublicKey();
    if (!publicKey) {
        return { success: false, reason: 'not_configured' };
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
    }

    const json = subscription.toJSON();
    await notificationApi.subscribe({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
    });

    localStorage.setItem(PUSH_REGISTERED_KEY, 'true');
    return { success: true };
}

export async function unregisterWebPush() {
    if (!isPushSupported()) return;

    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
        try {
            await notificationApi.unsubscribe(subscription.endpoint);
        } catch {
            // ignore if already removed server-side
        }
        await subscription.unsubscribe();
    }

    localStorage.removeItem(PUSH_REGISTERED_KEY);
}

export function hasPushRegistrationHint() {
    return localStorage.getItem(PUSH_REGISTERED_KEY) === 'true';
}

export { isPushSupported };
