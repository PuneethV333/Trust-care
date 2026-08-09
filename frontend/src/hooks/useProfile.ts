import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import {
  currentUserSchema,
  householdProfileSchema,
  updateHouseholdProfileSchema,
  type CurrentUser,
  type HouseholdProfile,
  type HouseholdProfileInput,
} from '../schemas/user.schema';
import {
  helperEarningsSchema,
  helperProfileSchema,
  updateHelperProfileInputSchema,
  type HelperEarnings,
  type HelperProfile,
  type HelperUpdateInput,
} from '../schemas/helper.schema';

export function useCurrentUser(enabled = true) {
  return useQuery<CurrentUser>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const data = await api.get<unknown>('/users/me');
      return currentUserSchema.parse(data);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateHousehold() {
  const queryClient = useQueryClient();

  return useMutation<HouseholdProfile, ApiError, HouseholdProfileInput>({
    mutationFn: async (input) => {
      const parsed = updateHouseholdProfileSchema.parse(input);
      const data = await api.patch<unknown>('/users/me', parsed);
      return householdProfileSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}

export function useMyHelperProfile(enabled = true) {
  return useQuery<HelperProfile>({
    queryKey: ['helpers', 'me'],
    queryFn: async () => {
      const data = await api.get<unknown>('/helpers/me');
      return helperProfileSchema.parse(data);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useMyEarnings(enabled = true) {
  return useQuery<HelperEarnings>({
    queryKey: ['helpers', 'me', 'earnings'],
    queryFn: async () => {
      const data = await api.get<unknown>('/helpers/me/earnings');
      return helperEarningsSchema.parse(data);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateHelper() {
  const queryClient = useQueryClient();

  return useMutation<HelperProfile, ApiError, HelperUpdateInput>({
    mutationFn: async (input) => {
      const parsed = updateHelperProfileInputSchema.parse(input);
      const data = await api.patch<unknown>('/helpers/me', parsed);
      return helperProfileSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['helpers', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['helpers', 'detail'] });
      void queryClient.invalidateQueries({ queryKey: ['helpers', 'search'] });
    },
  });
}