import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastService } from '../../services/toastService';
import { invitationsApi } from '../../api/invitationsApi';

export function useInvitationActions() {
    const queryClient = useQueryClient();

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['invitations'] });

    const getErrorMsg = (err, fallback) => {
        return err?.response?.data?.error?.message ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            fallback;
    };

    const createMutation = useMutation({
        mutationFn: (data) => invitationsApi.createSingle(data),
        onSuccess: (_data, vars) => {
            toastService.success(`Invitation sent to ${vars.email}`);
            invalidate();
        },
        onError: (err) => {
            toastService.error(getErrorMsg(err, 'Failed to send invitation'));
        },
    });

    const resendMutation = useMutation({
        mutationFn: (id) => invitationsApi.resend(id),
        onSuccess: () => {
            toastService.success('Invitation resent');
            invalidate();
        },
        onError: (err) => {
            toastService.error(getErrorMsg(err, 'Failed to resend'));
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => invitationsApi.revoke(id),
        onSuccess: () => {
            toastService.success('Invitation revoked');
            invalidate();
        },
        onError: (err) => {
            toastService.error(getErrorMsg(err, 'Failed to revoke'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => invitationsApi.remove(id),
        onSuccess: () => {
            toastService.success('Invitation deleted');
            invalidate();
        },
        onError: (err) => {
            toastService.error(getErrorMsg(err, 'Failed to delete'));
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => invitationsApi.bulkRemove(ids),
        onSuccess: () => {
            toastService.success('Selected invitations deleted');
            invalidate();
        },
        onError: (err) => {
            toastService.error(getErrorMsg(err, 'Failed to delete selected'));
        },
    });

    return { createMutation, resendMutation, revokeMutation, deleteMutation, bulkDeleteMutation };
}
