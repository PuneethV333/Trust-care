import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../lib/api';
import { reviewResponseSchema, type ReviewResponse } from '../schemas/review.schema';

export function useHelperReviews(helperId: string) {
  return useQuery<ReviewResponse[]>({
    queryKey: ['reviews', 'helper', helperId],
    queryFn: async () => {
      const data = await api.get<unknown>(`/reviews/helper/${helperId}`);
      return z.array(reviewResponseSchema).parse(data);
    },
    enabled: Boolean(helperId),
    staleTime: 300_000,
  });
}