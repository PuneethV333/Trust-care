import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import {
  BookingStatus,
  DisputeStatus,
  VerificationStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { bookingResponseSchema } from '../bookings/dto/booking.dto';
import {
  AdminDisputeItem,
  adminDisputeItemSchema,
  paginatedDisputesSchema,
} from '../bookings/dto/dispute.dto';
import {
  AdminAnalytics,
  AdminHelperItem,
  adminHelperItemSchema,
} from './dto/admin.dto';

const ANALYTICS_CACHE_TTL = 600;

const adminHelperSelect = {
  id: true,
  userId: true,
  fullName: true,
  phone: true,
  serviceType: true,
  experienceYears: true,
  bio: true,
  city: true,
  avatarUrl: true,
  verificationStatus: true,
  createdAt: true,
  user: { select: { email: true } },
} satisfies Prisma.HelperProfileSelect;

type AdminHelperRow = Prisma.HelperProfileGetPayload<{
  select: typeof adminHelperSelect;
}>;

const adminBookingSelect = {
  id: true,
  householdId: true,
  helperId: true,
  servicePlanId: true,
  status: true,
  scheduledDate: true,
  startTime: true,
  endTime: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  servicePlan: {
    select: { id: true, planType: true, price: true, description: true },
  },
  helper: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      serviceType: true,
      city: true,
    },
  },
  household: { select: { id: true, fullName: true } },
} satisfies Prisma.BookingSelect;

type AdminBookingRow = Prisma.BookingGetPayload<{
  select: typeof adminBookingSelect;
}>;

const adminDisputeSelect = {
  id: true,
  bookingId: true,
  raisedById: true,
  reason: true,
  status: true,
  resolution: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      id: true,
      scheduledDate: true,
      status: true,
      helper: { select: { id: true, fullName: true } },
      household: { select: { id: true, fullName: true } },
    },
  },
  raisedBy: { select: { id: true, email: true, role: true } },
} satisfies Prisma.DisputeSelect;

type AdminDisputeRow = Prisma.DisputeGetPayload<{
  select: typeof adminDisputeSelect;
}>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private toAdminHelper(row: AdminHelperRow): AdminHelperItem {
    return adminHelperItemSchema.parse({
      ...row,
      email: row.user.email,
      createdAt: row.createdAt.toISOString(),
    });
  }

  private toAdminBooking(row: AdminBookingRow) {
    return bookingResponseSchema.parse({
      ...row,
      scheduledDate: row.scheduledDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      servicePlan: row.servicePlan
        ? { ...row.servicePlan, price: Number(row.servicePlan.price) }
        : null,
    });
  }

  private toAdminDispute(row: AdminDisputeRow): AdminDisputeItem {
    return adminDisputeItemSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      booking: {
        ...row.booking,
        scheduledDate: row.booking.scheduledDate.toISOString(),
      },
    });
  }

  private async invalidateHelper(helperId: string) {
    await this.redis.del(`helper:profile:${helperId}`);
    await this.redis.deleteByPrefix('helpers:search:');
  }

  async getPendingHelpers(): Promise<AdminHelperItem[]> {
    const rows = await this.prisma.helperProfile.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: adminHelperSelect,
    });
    return rows.map((row) => this.toAdminHelper(row));
  }

  private async setHelperVerificationStatus(
    id: string,
    status: VerificationStatus,
  ): Promise<AdminHelperItem> {
    const helper = await this.prisma.helperProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!helper) {
      throw new NotFoundException('Helper not found');
    }

    const updated = await this.prisma.helperProfile.update({
      where: { id },
      data: { verificationStatus: status },
      select: adminHelperSelect,
    });

    await this.invalidateHelper(id);
    return this.toAdminHelper(updated);
  }

  async verifyHelper(id: string): Promise<AdminHelperItem> {
    return this.setHelperVerificationStatus(id, VerificationStatus.VERIFIED);
  }

  async rejectHelper(id: string): Promise<AdminHelperItem> {
    return this.setHelperVerificationStatus(id, VerificationStatus.REJECTED);
  }

  async listUsers(query: { page: number; perPage: number }) {
    const page = query.page;
    const perPage = query.perPage;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          email: true,
          role: true,
          onboardingCompleted: true,
          createdAt: true,
          householdProfile: { select: { id: true, fullName: true } },
          helperProfile: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async listAllBookings(query: {
    page: number;
    perPage: number;
    status?: BookingStatus;
  }) {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.BookingWhereInput = query.status
      ? { status: query.status }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: adminBookingSelect,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toAdminBooking(row)),
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async listDisputes(query: {
    page: number;
    perPage: number;
    status?: DisputeStatus;
  }) {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.DisputeWhereInput = query.status
      ? { status: query.status }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: adminDisputeSelect,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return paginatedDisputesSchema.parse({
      items: rows.map((row) => this.toAdminDispute(row)),
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    });
  }

  async resolveDispute(
    id: string,
    status: DisputeStatus,
    resolution: string,
  ): Promise<AdminDisputeItem> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: { status, resolution },
      select: adminDisputeSelect,
    });

    return this.toAdminDispute(updated);
  }

  async getPlatformAnalytics(): Promise<AdminAnalytics> {
    const cacheKey = 'admin:analytics';
    const cached = await this.redis.get<AdminAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      households,
      helpers,
      verifiedHelpers,
      totalBookings,
      avgRating,
      byStatus,
    ] = await Promise.all([
      this.prisma.householdProfile.count(),
      this.prisma.helperProfile.count(),
      this.prisma.helperProfile.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      this.prisma.booking.count(),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const bookingsByStatus = Object.fromEntries(
      Object.values(BookingStatus).map((status) => [status, 0]),
    ) as Record<BookingStatus, number>;
    for (const row of byStatus) {
      bookingsByStatus[row.status] = row._count._all;
    }

    const result: AdminAnalytics = {
      households,
      helpers,
      verifiedHelpers,
      totalBookings,
      bookingsByStatus,
      avgRating: avgRating._avg.rating ?? 0,
    };

    await this.redis.set(cacheKey, result, ANALYTICS_CACHE_TTL);
    return result;
  }
}
