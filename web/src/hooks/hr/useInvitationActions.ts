import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invitationsApi } from '../../api/invitationsApi';
import type { CreateInvitePayload } from '../../types/invitation.types';

export function useInvitationActions() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['invitations'] });

  const createMutation = useMutation({
    mutationFn: (data: CreateInvitePayload) => invitationsApi.createSingle(data),
    onSuccess: (_data, vars) => {
      toast.success(`Invitation sent to ${vars.email}`);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Failed to send invitation';
      toast.error(msg);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: () => {
      toast.success('Invitation resent');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Failed to resend';
      toast.error(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.revoke(id),
    onSuccess: () => {
      toast.success('Invitation revoked');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Failed to revoke';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.remove(id),
    onSuccess: () => {
      toast.success('Invitation deleted');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Failed to delete';
      toast.error(msg);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => invitationsApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success('Selected invitations deleted');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Failed to delete selected';
      toast.error(msg);
    },
  });

  return { createMutation, resendMutation, revokeMutation, deleteMutation, bulkDeleteMutation };
}
