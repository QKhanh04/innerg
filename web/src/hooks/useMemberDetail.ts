import { useQuery } from '@tanstack/react-query';
import { membersApi } from '../api/memberApi';

export const useMemberDetail = (userId) => {
  return useQuery({
    queryKey: ['members', userId],
    queryFn: () => membersApi.getDetail(userId),
    enabled: !!userId,
  });
};
