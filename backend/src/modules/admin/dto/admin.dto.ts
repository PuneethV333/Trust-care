import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  BookingStatus,
  Role,
  ServiceType,
  VerificationStatus,
} from '../../../../generated/prisma/enums';
import { bookingResponseSchema } from '../../bookings/dto/booking.dto';

const pageQuerySchema = z.coerce.number().int().min(1).default(1);
const perPageQuerySchema = z.coerce.number().int().min(1).max(100).default(10);

export const usersListQuerySchema = z.object({
  page: pageQuerySchema,
  perPage: perPageQuerySchema,
});

export const bookingsListQuerySchema = usersListQuerySchema.extend({
  status: z.nativeEnum(BookingStatus).optional(),
});

export const adminHelperItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string(),
  serviceType: z.nativeEnum(ServiceType),
  experienceYears: z.number().int(),
  bio: z.string().nullable(),
  city: z.string(),
  avatarUrl: z.string().nullable(),
  verificationStatus: z.nativeEnum(VerificationStatus),
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
  role: z.nativeEnum(Role),
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
  bookingsByStatus: z.record(z.nativeEnum(BookingStatus), z.number()),
  avgRating: z.number(),
});

export type AdminHelperItem = z.infer<typeof adminHelperItemSchema>;
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;

export class UsersListQueryDto extends createZodDto(usersListQuerySchema) {}
export class BookingsListQueryDto extends createZodDto(
  bookingsListQuerySchema,
) {}
export class AdminHelperDto extends createZodDto(adminHelperItemSchema) {}
export class PaginatedHelpersDto extends createZodDto(paginatedHelpersSchema) {}
export class PaginatedUsersDto extends createZodDto(paginatedUsersSchema) {}
export class PaginatedBookingsDto extends createZodDto(
  paginatedBookingsSchema,
) {}
export class AdminAnalyticsDto extends createZodDto(adminAnalyticsSchema) {}
