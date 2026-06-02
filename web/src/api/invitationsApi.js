import api from './axios';

export const invitationsApi = {
    getList: async (filters = {}) => {
        const response = await api.get('/hr/invitations', { params: filters });
        return response.data;
    },

    createSingle: async (data) => {
        const response = await api.post('/hr/invitations', data);
        return response.data;
    },

    resend: async (id) => {
        const response = await api.post(`/hr/invitations/${id}/resend`);
        return response.data;
    },

    revoke: async (id) => {
        await api.post(`/hr/invitations/${id}/revoke`);
    },

    validateFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/hr/invitations/validate-file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    bulkSend: async (invites) => {
        const response = await api.post('/hr/invitations/bulk', { invites });
        return response.data;
    },

    remove: async (id) => {
        await api.delete(`/hr/invitations/${id}`);
    },

    bulkRemove: async (ids) => {
        await api.post('/hr/invitations/bulk-delete', { ids });
    },
};
