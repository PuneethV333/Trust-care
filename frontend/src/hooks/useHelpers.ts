import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  helperProfilePublicSchema,
  searchHelpersQuerySchema,
  searchHelpersResponseSchema,
  type HelperProfilePublic,
  type SearchHelpersQuery,
  type SearchHelpersResponse,
} from '../schemas/helper.schema';

export function useHelperSearch(filters: SearchHelpersQuery) {
  return useQuery<SearchHelpersResponse>({
    queryKey: ['helpers', 'search', filters],
    queryFn: async () => {
      const parsed = searchHelpersQuerySchema.parse(filters);
      const items = await api.get<unknown>('/helpers', {
        type: parsed.type,
        city: parsed.city,
        minExperience: parsed.minExperience,
        planType: parsed.planType,
        page: parsed.page,
      });
      return searchHelpersResponseSchema.parse(items);
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useHelperProfile(helperId: string) {
  return useQuery<HelperProfilePublic>({
    queryKey: ['helpers', 'detail', helperId],
    queryFn: async () => {
      const data = await api.get<unknown>(`/helpers/${helperId}`);
      return helperProfilePublicSchema.parse(data);
    },
    enabled: Boolean(helperId),
    staleTime: 300_000,
  });
}