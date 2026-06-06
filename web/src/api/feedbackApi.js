import api from './axios';

export const feedbackApi = {
    getLearnerCriteria: async () => {
        const response = await api.get('/feedback/criteria/learner');
        return response.data;
    },

    submitFeedback: async (eventId, data) => {
        const response = await api.post(`/feedback/event/${eventId}`, data);
        return response.data;
    },

    getEventFeedbacks: async (eventId) => {
        const response = await api.get(`/feedback/event/${eventId}`);
        return response.data;
    }
};
