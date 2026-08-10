import { z } from 'zod';
import {
  DAY_VALUES,
  PLAN_TYPE_VALUES,
  SERVICE_TYPE_VALUES,
  TIME_SLOT_VALUES,
  VERIFICATION_STATUS_VALUES,
} from '../types';

export const availabilitySchema = z.record(
  z.string().min(2).max(3),
  z.array(z.string()),
);

export const documentSchema = z.object({
  id: z.string().uuid(),
  docType: z.string(),
  url: z.string().url(),
  status: z.enum(VERIFICATION_STATUS_VALUES),
  createdAt: z.string().datetime(),
});

export const servicePlanSchema = z.object({
  id: z.string().uuid(),
  planType: z.enum(PLAN_TYPE_VALUES),
  price: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});

export const helperProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string(),
  serviceType: z.enum(SERVICE_TYPE_VALUES),
  experienceYears: z.number(),
  bio: z.string().nullable(),
  city: z.string(),
  avatarUrl: z.string().nullable(),
  availability: availabilitySchema,
  verificationStatus: z.enum(VERIFICATION_STATUS_VALUES),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  documents: z.array(documentSchema),
  servicePlans: z.array(servicePlanSchema),
});

export const helperProfilePublicSchema = helperProfileSchema.omit({
  phone: true,
  documents: true,
});

export const helperSearchItemSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  serviceType: z.enum(SERVICE_TYPE_VALUES),
  city: z.string(),
  experienceYears: z.number(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  verificationStatus: z.enum(VERIFICATION_STATUS_VALUES),
  servicePlans: z.array(servicePlanSchema),
});

export const searchHelpersResponseSchema = z.object({
  items: z.array(helperSearchItemSchema),
  page: z.number(),
  perPage: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const monthlyEarningsSchema = z.object({
  month: z.string(),
  totalEarned: z.number(),
  count: z.number(),
});

export const helperEarningsSchema = z.object({
  totalEarned: z.number(),
  completedBookings: z.number(),
  monthly: z.array(monthlyEarningsSchema),
});

export const helperOnboardingInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  serviceType: z.enum(SERVICE_TYPE_VALUES),
  experienceYears: z.number().int().min(0).max(60),
  bio: z.string().max(1000).optional(),
  city: z.string().trim().min(2),
  avatarUrl: z.string().url().optional(),
  availability: availabilitySchema.optional(),
});

export const updateHelperProfileInputSchema = helperOnboardingInputSchema
  .pick({
    fullName: true,
    phone: true,
    serviceType: true,
    experienceYears: true,
    bio: true,
    city: true,
    avatarUrl: true,
  })
  .partial();

export const updateAvailabilityInputSchema = z.object({
  availability: availabilitySchema,
});

export const uploadDocumentInputSchema = z.object({
  docType: z.string().trim().min(2),
  url: z.string().url(),
});

export const searchHelpersQuerySchema = z.object({
  type: z.enum(SERVICE_TYPE_VALUES).optional(),
  city: z.string().trim().min(1).optional(),
  minExperience: z.coerce.number().int().min(0).optional(),
  planType: z.enum(PLAN_TYPE_VALUES).optional(),
  day: z.enum(DAY_VALUES).optional(),
  timeSlot: z.enum(TIME_SLOT_VALUES).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const createServicePlanInputSchema = z.object({
  planType: z.enum(PLAN_TYPE_VALUES),
  price: z.number().nonnegative(),
  description: z.string().max(500).optional(),
});

export const updateServicePlanInputSchema = createServicePlanInputSchema.partial();

export type HelperProfile = z.infer<typeof helperProfileSchema>;
export type HelperProfilePublic = z.infer<typeof helperProfilePublicSchema>;
export type HelperSearchItem = z.infer<typeof helperSearchItemSchema>;
export type SearchHelpersResponse = z.infer<typeof searchHelpersResponseSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export type VerificationDocument = z.infer<typeof documentSchema>;
export type HelperEarnings = z.infer<typeof helperEarningsSchema>;
export type SearchHelpersQuery = z.infer<typeof searchHelpersQuerySchema>;
export type ServicePlan = z.infer<typeof servicePlanSchema>;
export type CreateServicePlanInput = z.infer<typeof createServicePlanInputSchema>;
export type HelperUpdateInput = z.infer<typeof updateHelperProfileInputSchema>;
