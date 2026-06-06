import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { membersApi } from '../api/memberApi';

export const useMembers = (filters = {}) => {
    return useQuery({
        queryKey: ['members', filters],
        queryFn: () => membersApi.getList(filters),
        placeholderData: keepPreviousData
    });
};
