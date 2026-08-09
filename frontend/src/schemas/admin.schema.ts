import { z } from 'zod';
import {
  BOOKING_STATUS_VALUES,
  ROLE_VALUES,
  SERVICE_TYPE_VALUES,
  VERIFICATION_STATUS_VALUES,
} from '../types';
import { bookingResponseSchema } from './booking.schema';

export const adminHelperItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string(),
  serviceType: z.enum(SERVICE_TYPE_VALUES),
  experienceYears: z.number().int(),
  bio: z.string().nullable(),
  city: z.string(),
  avatarUrl: z.string().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUS_VALUES),
  createdAt: z.string().datetime(),
});

export const paginatedHelpersSchema = z.object({
  items: z.array(adminHelperItemSchema),
  page: z.number(),
  perPage: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const adminUserItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(ROLE_VALUES),
  onboardingCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  householdProfile: z
    .object({ id: z.string().uuid(), fullName: z.string() })
    .nullable(),
  helperProfile: z
    .object({ id: z.string().uuid(), fullName: z.string() })
    .nullable(),
});

export const paginatedUsersSchema = z.object({
  items: z.array(adminUserItemSchema),
  page: z.number(),
  perPage: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const paginatedBookingsSchema = z.object({
  items: z.array(bookingResponseSchema),
  page: z.number(),
  perPage: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const adminAnalyticsSchema = z.object({
  households: z.number(),
  helpers: z.number(),
  verifiedHelpers: z.number(),
  totalBookings: z.number(),
  bookingsByStatus: z.record(z.enum(BOOKING_STATUS_VALUES), z.number()),
  avgRating: z.number(),
});

export type AdminHelperItem = z.infer<typeof adminHelperItemSchema>;
export type PaginatedHelpers = z.infer<typeof paginatedHelpersSchema>;
export type AdminUserItem = z.infer<typeof adminUserItemSchema>;
export type PaginatedUsers = z.infer<typeof paginatedUsersSchema>;
export type PaginatedBookings = z.infer<typeof paginatedBookingsSchema>;
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;