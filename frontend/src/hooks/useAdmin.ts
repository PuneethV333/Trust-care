import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import {
  adminAnalyticsSchema,
  adminHelperItemSchema,
  paginatedBookingsSchema,
  paginatedUsersSchema,
  type AdminAnalytics,
  type AdminHelperItem,
  type PaginatedBookings,
  type PaginatedUsers,
} from '../schemas/admin.schema';
import type { BookingStatus } from '../types';

export function usePendingHelpers() {
  return useQuery<AdminHelperItem[]>({
    queryKey: ['admin', 'pending-helpers'],
    queryFn: async () => {
      const data = await api.get<unknown>('/admin/helpers/pending');
      return adminHelperItemSchema.array().parse(data);
    },
    staleTime: 30_000,
  });
}

export function useAdminHelpersDecision() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminHelperItem,
    ApiError,
    { id: string; action: 'verify' | 'reject' }
  >({
    mutationFn: async ({ id, action }) => {
      const data = await api.patch<unknown>(`/admin/helpers/${id}/${action}`);
      return adminHelperItemSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pending-helpers'] });
      void queryClient.invalidateQueries({ queryKey: ['helpers', 'search'] });
      void queryClient.invalidateQueries({ queryKey: ['helpers', 'detail'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}

export function useAdminUsers(page = 1, perPage = 10) {
  return useQuery<PaginatedUsers>({
    queryKey: ['admin', 'users', page, perPage],
    queryFn: async () => {
      const data = await api.get<unknown>('/admin/users', { page, perPage });
      return paginatedUsersSchema.parse(data);
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminBookings(filters: {
  status?: BookingStatus;
  page?: number;
  perPage?: number;
}) {
  const { status, page = 1, perPage = 10 } = filters;
  return useQuery<PaginatedBookings>({
    queryKey: ['admin', 'bookings', status ?? 'all', page, perPage],
    queryFn: async () => {
      const data = await api.get<unknown>('/admin/bookings', {
        status: status ?? undefined,
        page,
        perPage,
      });
      return paginatedBookingsSchema.parse(data);
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const data = await api.get<unknown>('/admin/analytics');
      return adminAnalyticsSchema.parse(data);
    },
    staleTime: 300_000,
  });
}