import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  searchHelpersQuerySchema,
  searchHelpersResponseSchema,
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