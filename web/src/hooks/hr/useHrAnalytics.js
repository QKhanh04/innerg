import { useQuery } from '@tanstack/react-query';
import { hrAnalyticsApi } from '../../api/hrApi';

export function useHrAnalyticsOverview(params = {}) {
    return useQuery({
        queryKey: ['hr', 'analytics', 'overview', params],
        queryFn: () => hrAnalyticsApi.getOverview(params),
    });
}

export function useHrAnalyticsCharts(params = {}) {
    return useQuery({
        queryKey: ['hr', 'analytics', 'charts', params],
        queryFn: () => hrAnalyticsApi.getCharts(params),
    });
}

export function useHrSkillMap() {
    return useQuery({
        queryKey: ['hr', 'analytics', 'skill-map'],
        queryFn: () => hrAnalyticsApi.getSkillMap(),
    });
}
