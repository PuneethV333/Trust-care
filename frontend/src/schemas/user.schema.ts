import { z } from 'zod';
import { ROLE_VALUES, VERIFICATION_STATUS_VALUES } from '../types';

export const householdProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  avatarUrl: z.string().nullable(),
});

export const helperProfileSummarySchema = z.object({
  id: z.string().uuid(),
  verificationStatus: z.enum(VERIFICATION_STATUS_VALUES),
});

export const currentUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  role: z.enum(ROLE_VALUES),
  onboardingCompleted: z.boolean(),
  householdProfile: householdProfileSchema.nullable(),
  helperProfile: helperProfileSummarySchema.nullable(),
});

export const syncUserResponseSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(ROLE_VALUES),
  onboardingCompleted: z.boolean(),
});

export const householdProfileInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  avatarUrl: z.string().url().optional(),
});

export const householdOnboardingSchema = householdProfileInputSchema;
export const updateHouseholdProfileSchema = householdProfileInputSchema.partial();

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type SyncUserResponse = z.infer<typeof syncUserResponseSchema>;
export type HouseholdProfile = z.infer<typeof householdProfileSchema>;
export type HouseholdProfileInput = z.infer<typeof householdProfileInputSchema>;
