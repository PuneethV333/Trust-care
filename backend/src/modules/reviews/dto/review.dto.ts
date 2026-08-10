import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PlanType } from '../../../../generated/prisma/enums';

export const createReviewInputSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const reviewSummarySchema = z.object({
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
  household: reviewSummarySchema.nullable(),
  helper: reviewSummarySchema.nullable(),
  createdAt: z.string().datetime(),
});

export const pendingReviewSchema = z.object({
  bookingId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  planType: z.nativeEnum(PlanType),
  price: z.number(),
  otherParty: z.object({
    fullName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});

export const myReviewsSchema = z.object({
  reviewed: z.array(reviewResponseSchema),
  pending: z.array(pendingReviewSchema),
});

export type ReviewResponse = z.infer<typeof reviewResponseSchema>;
export type PendingReview = z.infer<typeof pendingReviewSchema>;
export type MyReviews = z.infer<typeof myReviewsSchema>;

export class CreateReviewDto extends createZodDto(createReviewInputSchema) {}
export class ReviewDto extends createZodDto(reviewResponseSchema) {}
export class PendingReviewDto extends createZodDto(pendingReviewSchema) {}
export class MyReviewsDto extends createZodDto(myReviewsSchema) {}
