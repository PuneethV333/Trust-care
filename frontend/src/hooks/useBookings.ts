import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, ApiError } from '../lib/api';
import {
  bookingResponseSchema,
  createBookingInputSchema,
  type BookingResponse,
  type CreateBookingInput,
} from '../schemas/booking.schema';

export type BookingAction = 'accept' | 'reject' | 'cancel' | 'complete';

function invalidateMyBookings(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
}

export function useMyBookings(enabled = true) {
  return useQuery<BookingResponse[]>({
    queryKey: ['bookings', 'me'],
    queryFn: async () => {
      const data = await api.get<unknown>('/bookings/me');
      return z.array(bookingResponseSchema).parse(data);
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<BookingResponse, ApiError, CreateBookingInput>({
    mutationFn: async (input) => {
      const parsed = createBookingInputSchema.parse(input);
      return bookingResponseSchema.parse(
        await api.post<unknown>('/bookings', parsed),
      );
    },
    onSuccess: () => {
      invalidateMyBookings(queryClient);
    },
  });
}

export function useBookingAction() {
  const queryClient = useQueryClient();

  return useMutation<
    BookingResponse,
    ApiError,
    { id: string; action: BookingAction }
  >({
    mutationFn: async ({ id, action }) => {
      const data = await api.patch<unknown>(`/bookings/${id}/${action}`);
      return bookingResponseSchema.parse(data);
    },
    onSuccess: () => {
      invalidateMyBookings(queryClient);
    },
  });
}