import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { hasPushRegistrationHint, isPushSupported, registerWebPush } from '../services/pushNotificationService';

export function usePushNotifications() {
    const { user } = useAuth();
    const attemptedRef = useRef(false);

    useEffect(() => {
        if (!user || attemptedRef.current || !isPushSupported()) {
            return;
        }

        attemptedRef.current = true;

        if (Notification.permission === 'granted' || !hasPushRegistrationHint()) {
            registerWebPush().catch(() => {
                // silent — user may deny or server may not have VAPID configured
            });
        }
    }, [user]);
}
