import api from './axios';

export const hrAnalyticsApi = {
    getOverview: (params = {}) => api.get('/hr/analytics/overview', { params }).then((r) => r.data),
    getCharts: (params = {}) => api.get('/hr/analytics/charts', { params }).then((r) => r.data),
    getSkillMap: () => api.get('/hr/analytics/skill-map').then((r) => r.data),
};

export const hrWishlistsApi = {
    list: (params = {}) => api.get('/hr/wishlists', { params }).then((r) => r.data),
    updateStatus: (id, data) => api.patch(`/hr/wishlists/${id}/status`, data),
    assignTrainer: (id, trainerId) => api.patch(`/hr/wishlists/${id}/assign-trainer`, { trainerId }),
    linkEvent: (id, trainingEventId) => api.patch(`/hr/wishlists/${id}/link-event`, { trainingEventId }),
    suggestTrainers: (id) => api.get(`/hr/wishlists/${id}/suggest-trainers`).then((r) => r.data),
};

export const hrModerationApi = {
    pendingEvents: (params = {}) => api.get('/hr/moderation/events', { params }).then((r) => r.data),
    reviewEvent: (id, data) => api.patch(`/hr/moderation/events/${id}/review`, data),
    pendingResources: () => api.get('/hr/moderation/resources').then((r) => r.data),
    reviewResource: (id, data) => api.patch(`/hr/moderation/resources/${id}/review`, data),
};

export const hrDepartmentsApi = {
    list: () => api.get('/hr/departments').then((r) => r.data),
    get: (id) => api.get(`/hr/departments/${id}`).then((r) => r.data),
    stats: (id) => api.get(`/hr/departments/${id}/stats`).then((r) => r.data),
    create: (data) => api.post('/hr/departments', data).then((r) => r.data),
    update: (id, data) => api.put(`/hr/departments/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/hr/departments/${id}`),
};

export const hrMembersApi = {
    list: (params = {}) => api.get('/hr/members', { params }).then((r) => r.data),
    updateStatus: (id, data) => api.patch(`/hr/members/${id}/status`, data),
};

export const hrRewardsApi = {
    pointRules: {
        list: () => api.get('/hr/point-rules').then((r) => r.data),
        create: (data) => api.post('/hr/point-rules', data).then((r) => r.data),
        update: (id, data) => api.put(`/hr/point-rules/${id}`, data).then((r) => r.data),
        remove: (id) => api.delete(`/hr/point-rules/${id}`),
    },
    rewards: {
        list: () => api.get('/hr/rewards').then((r) => r.data),
        create: (data) => api.post('/hr/rewards', data).then((r) => r.data),
        update: (id, data) => api.put(`/hr/rewards/${id}`, data).then((r) => r.data),
        remove: (id) => api.delete(`/hr/rewards/${id}`),
    },
    badges: {
        list: () => api.get('/hr/badges').then((r) => r.data),
        create: (data) => api.post('/hr/badges', data).then((r) => r.data),
        update: (id, data) => api.put(`/hr/badges/${id}`, data).then((r) => r.data),
        remove: (id) => api.delete(`/hr/badges/${id}`),
    },
    redemptions: {
        list: (status) => api.get('/hr/redemptions', { params: { status } }).then((r) => r.data),
        updateStatus: (id, data) => api.patch(`/hr/redemptions/${id}/status`, data),
    },
    adjustPoints: (data) => api.post('/hr/points/adjust', data),
};

export const hrReportsApi = {
    events: (params = {}) => api.get('/hr/reports/events', { params }).then((r) => r.data),
    eventDetail: (id) => api.get(`/hr/reports/events/${id}`).then((r) => r.data),
    member: (userId) => api.get(`/hr/reports/members/${userId}`).then((r) => r.data),
    exportUrl: (type, params = {}) => {
        const qs = new URLSearchParams({ type, format: 'csv', ...params }).toString();
        return `/hr/reports/export?${qs}`;
    },
};

export const hrWorkspaceApi = {
    getSettings: () => api.get('/hr/workspace/settings').then((r) => r.data),
    updateSettings: (data) => api.put('/hr/workspace/settings', data).then((r) => r.data),
};

export const hrMeetingRoomsApi = {
    list: () => api.get('/hr/meeting-rooms').then((r) => r.data),
    availability: (params) => api.get('/hr/meeting-rooms/availability', { params }).then((r) => r.data),
    create: (data) => api.post('/hr/meeting-rooms', data).then((r) => r.data),
    update: (id, data) => api.put(`/hr/meeting-rooms/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/hr/meeting-rooms/${id}`),
};

export const hrEventsApi = {
    create: (data) => api.post('/hr/events', data).then((r) => r.data),
};

export const hrNotificationsApi = {
    broadcast: (data) => api.post('/hr/notifications/broadcast', data).then((r) => r.data),
    history: () => api.get('/hr/notifications/history').then((r) => r.data),
};
