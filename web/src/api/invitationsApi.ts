import api from './axios';
import type {
  CreateInvitePayload,
  BulkInviteItem,
  InviteListFilters,
  PaginatedInvites,
  ValidateFileResult,
} from '../types/invitation.types';

export const invitationsApi = {
  getList: async (filters: Partial<InviteListFilters> = {}): Promise<PaginatedInvites> => {
    const response = await api.get('/hr/invitations', { params: filters });
    return response.data;
  },

  createSingle: async (data: CreateInvitePayload) => {
    const response = await api.post('/hr/invitations', data);
    return response.data;
  },

  resend: async (id: string) => {
    const response = await api.post(`/hr/invitations/${id}/resend`);
    return response.data;
  },

  revoke: async (id: string) => {
    await api.post(`/hr/invitations/${id}/revoke`);
  },

  validateFile: async (file: File): Promise<ValidateFileResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/hr/invitations/validate-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bulkSend: async (invites: BulkInviteItem[]) => {
    const response = await api.post('/hr/invitations/bulk', { invites });
    return response.data;
  },

  remove: async (id: string) => {
    await api.delete(`/hr/invitations/${id}`);
  },

  bulkRemove: async (ids: string[]) => {
    await api.post('/hr/invitations/bulk-delete', { ids });
  },
};
