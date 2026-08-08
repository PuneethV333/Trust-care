import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createReviewInputSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const householdReviewSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
});

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  householdId: z.string().uuid(),
  helperId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  household: householdReviewSummarySchema.nullable(),
  createdAt: z.string().datetime(),
});

export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

export class CreateReviewDto extends createZodDto(createReviewInputSchema) {}
export class ReviewDto extends createZodDto(reviewResponseSchema) {}
