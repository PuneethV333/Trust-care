import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  BookingStatus,
  PlanType,
  ServiceType,
} from '../../../../generated/prisma/enums';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createBookingInputSchema = z.object({
  helperId: z.string().uuid(),
  servicePlanId: z.string().uuid(),
  scheduledDate: z.string().datetime({ offset: true }),
  startTime: z.string().regex(timePattern, 'Start time must be HH:MM'),
  endTime: z.string().regex(timePattern, 'End time must be HH:MM'),
  notes: z.string().max(500).optional(),
});

export const servicePlanSummarySchema = z.object({
  id: z.string().uuid(),
  planType: z.nativeEnum(PlanType),
  price: z.number(),
  description: z.string().nullable(),
});

export const helperSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  serviceType: z.nativeEnum(ServiceType),
  city: z.string(),
});

export const householdSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
});

export const bookingResponseSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  helperId: z.string().uuid(),
  servicePlanId: z.string().uuid(),
  status: z.nativeEnum(BookingStatus),
  scheduledDate: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().nullable(),
  servicePlan: servicePlanSummarySchema.nullable(),
  helper: helperSummarySchema.nullable(),
  household: householdSummarySchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BookingResponse = z.infer<typeof bookingResponseSchema>;

export class CreateBookingDto extends createZodDto(createBookingInputSchema) {}
export class BookingDto extends createZodDto(bookingResponseSchema) {}
