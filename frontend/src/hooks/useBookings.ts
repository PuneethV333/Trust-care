import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import {
  bookingResponseSchema,
  createBookingInputSchema,
  type BookingResponse,
  type CreateBookingInput,
} from '../schemas/booking.schema';

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
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });
}