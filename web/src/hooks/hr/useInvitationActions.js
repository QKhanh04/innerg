import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invitationsApi } from '../../api/invitationsApi';

export function useInvitationActions() {
    const queryClient = useQueryClient();

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['invitations'] });

    const createMutation = useMutation({
        mutationFn: (data) => invitationsApi.createSingle(data),
        onSuccess: (_data, vars) => {
            toast.success(`Invitation sent to ${vars.email}`);
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to send invitation';
            toast.error(msg);
        },
    });

    const resendMutation = useMutation({
        mutationFn: (id) => invitationsApi.resend(id),
        onSuccess: () => {
            toast.success('Invitation resent');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to resend';
            toast.error(msg);
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => invitationsApi.revoke(id),
        onSuccess: () => {
            toast.success('Invitation revoked');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to revoke';
            toast.error(msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => invitationsApi.remove(id),
        onSuccess: () => {
            toast.success('Invitation deleted');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to delete';
            toast.error(msg);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => invitationsApi.bulkRemove(ids),
        onSuccess: () => {
            toast.success('Selected invitations deleted');
            invalidate();
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Failed to delete selected';
            toast.error(msg);
        },
    });

    return { createMutation, resendMutation, revokeMutation, deleteMutation, bulkDeleteMutation };
}
