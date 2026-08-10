import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  BookingStatus,
  DisputeStatus,
  Role,
} from '../../../../generated/prisma/enums';

export const createDisputeInputSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export const disputeSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  raisedById: z.string().uuid(),
  reason: z.string(),
  status: z.nativeEnum(DisputeStatus),
  resolution: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const adminDisputeItemSchema = disputeSchema.extend({
  booking: z.object({
    id: z.string().uuid(),
    scheduledDate: z.string().datetime(),
    status: z.nativeEnum(BookingStatus),
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
    role: z.nativeEnum(Role),
  }),
});

export const disputesListQuerySchema = z.object({
  status: z.nativeEnum(DisputeStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
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

export type Dispute = z.infer<typeof disputeSchema>;
export type AdminDisputeItem = z.infer<typeof adminDisputeItemSchema>;

export class CreateDisputeDto extends createZodDto(createDisputeInputSchema) {}
export class DisputeDto extends createZodDto(disputeSchema) {}
export class DisputesListQueryDto extends createZodDto(
  disputesListQuerySchema,
) {}
export class PaginatedDisputesDto extends createZodDto(
  paginatedDisputesSchema,
) {}
export class ResolveDisputeDto extends createZodDto(
  resolveDisputeInputSchema,
) {}
