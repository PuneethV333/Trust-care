import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { BookingStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  CreateReviewDto,
  reviewResponseSchema,
  ReviewResponse,
} from './dto/review.dto';

const REVIEWS_CACHE_TTL = 300;

const reviewSelect = {
  id: true,
  bookingId: true,
  householdId: true,
  helperId: true,
  rating: true,
  comment: true,
  createdAt: true,
  household: { select: { id: true, fullName: true, avatarUrl: true } },
} satisfies Prisma.ReviewSelect;

type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private toReview(review: ReviewRow): ReviewResponse {
    return reviewResponseSchema.parse({
      ...review,
      createdAt: review.createdAt.toISOString(),
    });
  }

  async createReview(
    firebaseUid: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponse> {
    const household = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { householdProfile: { select: { id: true } } },
    });
    if (!household?.householdProfile) {
      throw new NotFoundException(
        'Household profile not found. Complete onboarding first.',
      );
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      select: { id: true, status: true, householdId: true, helperId: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.householdId !== household.householdProfile.id) {
      throw new ForbiddenException('Not the household for this booking');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Review already exists for this booking');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId: dto.bookingId,
          householdId: booking.householdId,
          helperId: booking.helperId,
          rating: dto.rating,
          comment: dto.comment,
        },
        select: reviewSelect,
      });

      const agg = await tx.review.aggregate({
        where: { helperId: booking.helperId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.helperProfile.update({
        where: { id: booking.helperId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count._all,
        },
      });

      return created;
    });

    await this.redis.del(`reviews:helper:${booking.helperId}`);
    await this.redis.del(`helper:profile:${booking.helperId}`);
    return this.toReview(review);
  }

  async getHelperReviews(helperId: string): Promise<ReviewResponse[]> {
    const cacheKey = `reviews:helper:${helperId}`;
    const cached = await this.redis.get<ReviewResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const helper = await this.prisma.helperProfile.findUnique({
      where: { id: helperId },
      select: { id: true },
    });
    if (!helper) {
      throw new NotFoundException('Helper not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { helperId },
      orderBy: { createdAt: 'desc' },
      select: reviewSelect,
    });

    const result = reviews.map((review) => this.toReview(review));
    await this.redis.set(cacheKey, result, REVIEWS_CACHE_TTL);
    return result;
  }
}
