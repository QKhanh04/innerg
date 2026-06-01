import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { invitationsApi } from '../../api/invitationsApi';
import type { InviteListFilters } from '../../types/invitation.types';

export function useInvitations(filters: Partial<InviteListFilters> = {}) {
  return useQuery({
    queryKey: ['invitations', filters],
    queryFn: () => invitationsApi.getList(filters),
    placeholderData: keepPreviousData,
  });
}
