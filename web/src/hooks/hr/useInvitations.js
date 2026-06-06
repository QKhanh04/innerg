import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { invitationsApi } from '../../api/invitationsApi';

export function useInvitations(filters = {}) {
    return useQuery({
        queryKey: ['invitations', filters],
        queryFn: () => invitationsApi.getList(filters),
        placeholderData: keepPreviousData,
    });
}
