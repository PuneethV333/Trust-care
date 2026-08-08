import { z } from 'zod';
import { BOOKING_STATUS_VALUES, PLAN_TYPE_VALUES, SERVICE_TYPE_VALUES } from '../types';

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
  planType: z.enum(PLAN_TYPE_VALUES),
  price: z.number(),
  description: z.string().nullable(),
});

export const helperSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  serviceType: z.enum(SERVICE_TYPE_VALUES),
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
  status: z.enum(BOOKING_STATUS_VALUES),
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

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
