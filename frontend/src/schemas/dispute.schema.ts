import { z } from 'zod';
import {
  BOOKING_STATUS_VALUES,
  DISPUTE_STATUS_VALUES,
  ROLE_VALUES,
} from '../types';

export const createDisputeInputSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export const disputeSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  raisedById: z.string().uuid(),
  reason: z.string(),
  status: z.enum(DISPUTE_STATUS_VALUES),
  resolution: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const adminDisputeItemSchema = disputeSchema.extend({
  booking: z.object({
    id: z.string().uuid(),
    scheduledDate: z.string().datetime(),
    status: z.enum(BOOKING_STATUS_VALUES),
    helper: z
      .object({ id: z.string().uuid(), fullName: z.string() })
      .nullable(),
    household: z
      .object({ id: z.string().uuid(), fullName: z.string() })
      .nullable(),
  }),
  raisedBy: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(ROLE_VALUES),
  }),
});

export const paginatedDisputesSchema = z.object({
  items: z.array(adminDisputeItemSchema),
  page: z.number(),
  perPage: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const resolveDisputeInputSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolution: z.string().trim().min(3).max(1000),
});

export type CreateDisputeInput = z.infer<typeof createDisputeInputSchema>;
export type Dispute = z.infer<typeof disputeSchema>;
export type AdminDisputeItem = z.infer<typeof adminDisputeItemSchema>;
export type PaginatedDisputes = z.infer<typeof paginatedDisputesSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeInputSchema>;