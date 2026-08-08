import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, ApiError } from '../lib/api';
import {
  createReviewInputSchema,
  reviewResponseSchema,
  type CreateReviewInput,
  type ReviewResponse,
} from '../schemas/review.schema';

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

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<ReviewResponse, ApiError, CreateReviewInput>({
    mutationFn: async (input) => {
      const parsed = createReviewInputSchema.parse(input);
      return reviewResponseSchema.parse(
        await api.post<unknown>('/reviews', parsed),
      );
    },
    onSuccess: (review) => {
      void queryClient.invalidateQueries({
        queryKey: ['reviews', 'helper', review.helperId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['helpers', 'detail', review.helperId],
      });
    },
  });
}