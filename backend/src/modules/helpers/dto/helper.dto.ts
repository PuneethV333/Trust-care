import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PlanType,
  ServiceType,
  VerificationStatus,
} from '../../../../generated/prisma/enums';

export const availabilitySchema = z.record(
  z.string().min(2).max(3),
  z.array(z.string()),
);

export const documentSchema = z.object({
  id: z.string().uuid(),
  docType: z.string(),
  url: z.string().url(),
  status: z.nativeEnum(VerificationStatus),
  createdAt: z.string().datetime(),
});

export const servicePlanSchema = z.object({
  id: z.string().uuid(),
  planType: z.nativeEnum(PlanType),
  price: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});

export const helperProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string(),
  serviceType: z.nativeEnum(ServiceType),
  experienceYears: z.number(),
  bio: z.string().nullable(),
  city: z.string(),
  avatarUrl: z.string().nullable(),
  availability: availabilitySchema,
  verificationStatus: z.nativeEnum(VerificationStatus),
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
  serviceType: z.nativeEnum(ServiceType),
  city: z.string(),
  experienceYears: z.number(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  verificationStatus: z.nativeEnum(VerificationStatus),
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

export const earningsBookingSchema = z.object({
  bookingId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  planType: z.nativeEnum(PlanType),
  price: z.number(),
  disputed: z.boolean(),
});

export const helperEarningsSchema = z.object({
  totalEarned: z.number(),
  completedBookings: z.number(),
  monthly: z.array(monthlyEarningsSchema),
  bookings: z.array(earningsBookingSchema),
});

export type HelperProfile = z.infer<typeof helperProfileSchema>;
export type HelperProfilePublic = z.infer<typeof helperProfilePublicSchema>;
export type HelperSearchItem = z.infer<typeof helperSearchItemSchema>;
export type SearchHelpersResponse = z.infer<typeof searchHelpersResponseSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export type VerificationDocument = z.infer<typeof documentSchema>;
export type HelperEarnings = z.infer<typeof helperEarningsSchema>;

export class HelperProfileDto extends createZodDto(helperProfileSchema) {}
export class HelperProfilePublicDto extends createZodDto(
  helperProfilePublicSchema,
) {}
export class SearchHelpersResponseDto extends createZodDto(
  searchHelpersResponseSchema,
) {}
export class VerificationDocumentDto extends createZodDto(documentSchema) {}
export class HelperEarningsDto extends createZodDto(helperEarningsSchema) {}
