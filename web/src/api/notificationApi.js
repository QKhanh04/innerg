import api from './axios';

export const notificationApi = {
    getVapidPublicKey: () =>
        api.get('/notifications/vapid-public-key').then((r) => r.data.publicKey),

    list: (params = {}) =>
        api.get('/notifications', { params }).then((r) => r.data),

    unreadCount: () =>
        api.get('/notifications/unread-count').then((r) => r.data.count),

    markAsRead: (id) =>
        api.patch(`/notifications/${id}/read`),

    markAllAsRead: () =>
        api.patch('/notifications/read-all'),

    subscribe: (data) =>
        api.post('/notifications/subscribe', data),

    unsubscribe: (endpoint) =>
        api.delete('/notifications/subscribe', { data: { endpoint } }),
};
