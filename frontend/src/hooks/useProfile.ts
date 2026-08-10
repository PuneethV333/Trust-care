import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
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
  createServicePlanInputSchema,
  helperEarningsSchema,
  helperProfileSchema,
  servicePlanSchema,
  updateAvailabilityInputSchema,
  updateHelperProfileInputSchema,
  updateServicePlanInputSchema,
  type Availability,
  type CreateServicePlanInput,
  type HelperEarnings,
  type HelperProfile,
  type HelperUpdateInput,
  type ServicePlan,
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

function invalidateHelperQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['helpers', 'me'] });
  void queryClient.invalidateQueries({ queryKey: ['helpers', 'detail'] });
  void queryClient.invalidateQueries({ queryKey: ['helpers', 'search'] });
}

export function useUpdateHelper() {
  const queryClient = useQueryClient();

  return useMutation<HelperProfile, ApiError, HelperUpdateInput>({
    mutationFn: async (input) => {
      const parsed = updateHelperProfileInputSchema.parse(input);
      const data = await api.patch<unknown>('/helpers/me', parsed);
      return helperProfileSchema.parse(data);
    },
    onSuccess: () => invalidateHelperQueries(queryClient),
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation<HelperProfile, ApiError, { availability: Availability }>({
    mutationFn: async (input) => {
      const parsed = updateAvailabilityInputSchema.parse(input);
      const data = await api.patch<unknown>('/helpers/me/availability', parsed);
      return helperProfileSchema.parse(data);
    },
    onSuccess: () => invalidateHelperQueries(queryClient),
  });
}

export function useCreateServicePlan() {
  const queryClient = useQueryClient();

  return useMutation<ServicePlan, ApiError, CreateServicePlanInput>({
    mutationFn: async (input) => {
      const parsed = createServicePlanInputSchema.parse(input);
      const data = await api.post<unknown>('/service-plans', parsed);
      return servicePlanSchema.parse(data);
    },
    onSuccess: () => invalidateHelperQueries(queryClient),
  });
}

export function useUpdateServicePlan() {
  const queryClient = useQueryClient();

  return useMutation<
    ServicePlan,
    ApiError,
    { id: string; input: Partial<CreateServicePlanInput> & { isActive?: boolean } }
  >({
    mutationFn: async ({ id, input }) => {
      const parsed = updateServicePlanInputSchema.parse(input);
      const data = await api.patch<unknown>(`/service-plans/${id}`, parsed);
      return servicePlanSchema.parse(data);
    },
    onSuccess: () => invalidateHelperQueries(queryClient),
  });
}

export function useDeleteServicePlan() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      await api.del<unknown>(`/service-plans/${id}`);
    },
    onSuccess: () => invalidateHelperQueries(queryClient),
  });
}
