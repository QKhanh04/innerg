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
      toast.success(`Đã gửi lời mời đến ${vars.email}`);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Gửi lời mời thất bại';
      toast.error(msg);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: () => {
      toast.success('Đã gửi lại lời mời');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Gửi lại thất bại';
      toast.error(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.revoke(id),
    onSuccess: () => {
      toast.success('Đã thu hồi lời mời');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Thu hồi thất bại';
      toast.error(msg);
    },
  });

  return { createMutation, resendMutation, revokeMutation };
}
