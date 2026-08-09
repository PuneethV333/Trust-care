import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '../../../generated/prisma/client';
import {
  Role,
  BookingStatus,
  VerificationStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  Availability,
  documentSchema,
  HelperEarnings,
  helperEarningsSchema,
  HelperProfile,
  HelperProfilePublic,
  helperProfilePublicSchema,
  helperProfileSchema,
  helperSearchItemSchema,
  SearchHelpersResponse,
  searchHelpersResponseSchema,
  VerificationDocument,
} from './dto/helper.dto';
import {
  HelperOnboardingDto,
  SearchHelpersQuery,
  UpdateHelperProfileDto,
  UploadDocumentDto,
} from './dto/helper-input.dto';

const HELPER_ME_TTL = 60;
const HELPER_PROFILE_TTL = 300;
const EARNINGS_TTL = 60;
const SEARCH_TTL = 120;
const SEARCH_PER_PAGE = 10;

type HelperRow = {
  servicePlans: Array<{ price: unknown }>;
  documents: Array<{ createdAt: Date }>;
};

@Injectable()
export class HelpersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private readonly documentsSelect = {
    id: true,
    docType: true,
    url: true,
    status: true,
    createdAt: true,
  } as const;

  private readonly servicePlansSelect = {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' as const },
  } as const;

  private readonly helperProfileSelect = {
    id: true,
    fullName: true,
    phone: true,
    serviceType: true,
    experienceYears: true,
    bio: true,
    city: true,
    avatarUrl: true,
    availability: true,
    verificationStatus: true,
    ratingAvg: true,
    ratingCount: true,
    documents: {
      select: this.documentsSelect,
      orderBy: { createdAt: 'desc' as const },
    },
    servicePlans: this.servicePlansSelect,
  } as const;

  private readonly publicProfileSelect = {
    id: true,
    fullName: true,
    serviceType: true,
    experienceYears: true,
    bio: true,
    city: true,
    avatarUrl: true,
    availability: true,
    verificationStatus: true,
    ratingAvg: true,
    ratingCount: true,
    servicePlans: this.servicePlansSelect,
  } as const;

  private readonly searchSelect = {
    id: true,
    fullName: true,
    avatarUrl: true,
    serviceType: true,
    city: true,
    experienceYears: true,
    ratingAvg: true,
    ratingCount: true,
    verificationStatus: true,
    servicePlans: this.servicePlansSelect,
  } as const;

  private toHelperProfile(helper: HelperRow): HelperProfile {
    return helperProfileSchema.parse({
      ...helper,
      servicePlans: helper.servicePlans.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
      documents: helper.documents.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  }

  private async findByFirebaseUid(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { helperProfile: { select: { id: true } } },
    });
    if (!user?.helperProfile) {
      throw new NotFoundException(
        'Helper profile not found. Complete onboarding first.',
      );
    }
    return user.helperProfile;
  }

  private async invalidateProfile(helperId: string, firebaseUid: string) {
    await this.redis.del(`helper:me:${firebaseUid}`);
    await this.redis.del(`helper:profile:${helperId}`);
    await this.redis.deleteByPrefix('helpers:search:');
  }

  private searchCacheKey(query: SearchHelpersQuery): string {
    const canonical = Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);
    return `helpers:search:${createHash('md5')
      .update(canonical.join('&'))
      .digest('hex')}`;
  }

  async completeHelperOnboarding(
    firebaseUid: string,
    dto: HelperOnboardingDto,
  ): Promise<HelperProfile> {
    const data = { ...dto, availability: dto.availability ?? {} };
    const user = await this.prisma.user.update({
      where: { firebaseUid },
      data: {
        role: Role.HELPER,
        onboardingCompleted: true,
        helperProfile: {
          upsert: { create: data, update: data },
        },
      },
      select: { helperProfile: { select: this.helperProfileSelect } },
    });

    await this.redis.del(`user:me:${firebaseUid}`);
    return this.toHelperProfile(user.helperProfile!);
  }

  async getMyHelperProfile(firebaseUid: string): Promise<HelperProfile> {
    const cacheKey = `helper:me:${firebaseUid}`;
    const cached = await this.redis.get<HelperProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { helperProfile: { select: this.helperProfileSelect } },
    });
    if (!user?.helperProfile) {
      throw new NotFoundException('Helper profile not found');
    }

    const result = this.toHelperProfile(user.helperProfile);
    await this.redis.set(cacheKey, result, HELPER_ME_TTL);
    return result;
  }

  async updateHelperProfile(
    firebaseUid: string,
    dto: UpdateHelperProfileDto,
  ): Promise<HelperProfile> {
    const helper = await this.findByFirebaseUid(firebaseUid);
    const updated = await this.prisma.helperProfile.update({
      where: { id: helper.id },
      data: dto,
      select: this.helperProfileSelect,
    });

    await this.invalidateProfile(helper.id, firebaseUid);
    return this.toHelperProfile(updated);
  }

  async updateAvailability(
    firebaseUid: string,
    availability: Availability,
  ): Promise<HelperProfile> {
    const helper = await this.findByFirebaseUid(firebaseUid);
    const updated = await this.prisma.helperProfile.update({
      where: { id: helper.id },
      data: { availability },
      select: this.helperProfileSelect,
    });

    await this.invalidateProfile(helper.id, firebaseUid);
    return this.toHelperProfile(updated);
  }

  async searchHelpers(
    query: SearchHelpersQuery,
  ): Promise<SearchHelpersResponse> {
    const cacheKey = this.searchCacheKey(query);
    const cached = await this.redis.get<SearchHelpersResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const page = query.page;
    const where: Prisma.HelperProfileWhereInput = {
      verificationStatus: VerificationStatus.VERIFIED,
      ...(query.type ? { serviceType: query.type } : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.minExperience !== undefined
        ? { experienceYears: { gte: query.minExperience } }
        : {}),
      ...(query.planType
        ? {
            servicePlans: {
              some: { planType: query.planType, isActive: true },
            },
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.helperProfile.findMany({
        where,
        select: this.searchSelect,
        orderBy: [{ ratingAvg: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * SEARCH_PER_PAGE,
        take: SEARCH_PER_PAGE,
      }),
      this.prisma.helperProfile.count({ where }),
    ]);

    const items = rows.map((row) =>
      helperSearchItemSchema.parse({
        ...row,
        servicePlans: row.servicePlans.map((p) => ({
          ...p,
          price: Number(p.price),
        })),
      }),
    );
    const result = searchHelpersResponseSchema.parse({
      items,
      page,
      perPage: SEARCH_PER_PAGE,
      total,
      totalPages: Math.ceil(total / SEARCH_PER_PAGE),
    });

    await this.redis.set(cacheKey, result, SEARCH_TTL);
    return result;
  }

  async getHelperById(id: string): Promise<HelperProfilePublic> {
    const cacheKey = `helper:profile:${id}`;
    const cached = await this.redis.get<HelperProfilePublic>(cacheKey);
    if (cached) {
      return cached;
    }

    const helper = await this.prisma.helperProfile.findUnique({
      where: { id },
      select: this.publicProfileSelect,
    });
    if (!helper) {
      throw new NotFoundException('Helper not found');
    }

    const result = helperProfilePublicSchema.parse({
      ...helper,
      servicePlans: helper.servicePlans.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
    });
    await this.redis.set(cacheKey, result, HELPER_PROFILE_TTL);
    return result;
  }

  async uploadVerificationDocument(
    firebaseUid: string,
    dto: UploadDocumentDto,
  ): Promise<VerificationDocument> {
    const helper = await this.findByFirebaseUid(firebaseUid);
    const doc = await this.prisma.verificationDocument.create({
      data: { helperId: helper.id, docType: dto.docType, url: dto.url },
      select: this.documentsSelect,
    });

    await this.redis.del(`helper:me:${firebaseUid}`);
    return documentSchema.parse({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
    });
  }

  async getEarnings(firebaseUid: string): Promise<HelperEarnings> {
    const cacheKey = `helper:earnings:${firebaseUid}`;
    const cached = await this.redis.get<HelperEarnings>(cacheKey);
    if (cached) {
      return cached;
    }

    const helper = await this.findByFirebaseUid(firebaseUid);
    const bookings = await this.prisma.booking.findMany({
      where: { helperId: helper.id, status: BookingStatus.COMPLETED },
      select: { scheduledDate: true, servicePlan: { select: { price: true } } },
    });

    const byMonth = new Map<string, { totalEarned: number; count: number }>();
    let totalEarned = 0;
    for (const booking of bookings) {
      const price = Number(booking.servicePlan.price);
      totalEarned += price;
      const month = `${booking.scheduledDate.getUTCFullYear()}-${String(
        booking.scheduledDate.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      const entry = byMonth.get(month) ?? { totalEarned: 0, count: 0 };
      entry.totalEarned += price;
      entry.count += 1;
      byMonth.set(month, entry);
    }

    const result = helperEarningsSchema.parse({
      totalEarned,
      completedBookings: bookings.length,
      monthly: [...byMonth.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({ month, ...value })),
    });

    await this.redis.set(cacheKey, result, EARNINGS_TTL);
    return result;
  }
}
