import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastService } from '../../services/toastService';
import { invitationsApi } from '../../api/invitationsApi';

export function useInvitationActions() {
    const queryClient = useQueryClient();

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['invitations'] });

    const createMutation = useMutation({
        mutationFn: (data) => invitationsApi.createSingle(data),
        onSuccess: (_data, vars) => {
            toastService.success(`Invitation sent to ${vars.email}`);
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to send invitation';
            toastService.error(msg);
        },
    });

    const resendMutation = useMutation({
        mutationFn: (id) => invitationsApi.resend(id),
        onSuccess: () => {
            toastService.success('Invitation resent');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to resend';
            toastService.error(msg);
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => invitationsApi.revoke(id),
        onSuccess: () => {
            toastService.success('Invitation revoked');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to revoke';
            toastService.error(msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => invitationsApi.remove(id),
        onSuccess: () => {
            toastService.success('Invitation deleted');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to delete';
            toastService.error(msg);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => invitationsApi.bulkRemove(ids),
        onSuccess: () => {
            toastService.success('Selected invitations deleted');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to delete selected';
            toastService.error(msg);
        },
    });

    return { createMutation, resendMutation, revokeMutation, deleteMutation, bulkDeleteMutation };
}
