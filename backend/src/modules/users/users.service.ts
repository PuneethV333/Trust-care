import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  CurrentUser,
  currentUserSchema,
  HouseholdProfile,
  householdProfileSchema,
} from './dto/user.dto';
import {
  HouseholdOnboardingDto,
  UpdateHouseholdProfileDto,
} from './dto/household-profile.dto';

const USER_ME_CACHE_TTL = 60;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private readonly householdProfileSelect = {
    id: true,
    fullName: true,
    phone: true,
    address: true,
    city: true,
    avatarUrl: true,
  } as const;

  private userMeKey(firebaseUid: string): string {
    return `user:me:${firebaseUid}`;
  }

  private async getCurrentUserRow(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        householdProfile: { select: this.householdProfileSelect },
        helperProfile: { select: { id: true, verificationStatus: true } },
      },
    });
  }

  async getCurrentUser(firebaseUid: string): Promise<CurrentUser> {
    const cacheKey = this.userMeKey(firebaseUid);
    const cached = await this.redis.get<CurrentUser>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.getCurrentUserRow(firebaseUid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = currentUserSchema.parse(user);
    await this.redis.set(cacheKey, result, USER_ME_CACHE_TTL);
    return result;
  }

  async completeHouseholdOnboarding(
    firebaseUid: string,
    dto: HouseholdOnboardingDto,
  ): Promise<CurrentUser> {
    const user = await this.prisma.user.update({
      where: { firebaseUid },
      data: {
        onboardingCompleted: true,
        householdProfile: {
          upsert: { create: dto, update: dto },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        householdProfile: { select: this.householdProfileSelect },
        helperProfile: { select: { id: true, verificationStatus: true } },
      },
    });

    await this.redis.del(this.userMeKey(firebaseUid));
    return currentUserSchema.parse(user);
  }

  async updateHouseholdProfile(
    firebaseUid: string,
    dto: UpdateHouseholdProfileDto,
  ): Promise<HouseholdProfile> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { householdProfile: { select: { id: true } } },
    });

    if (!user?.householdProfile) {
      throw new NotFoundException(
        'Household profile not found. Complete onboarding first.',
      );
    }

    const profile = await this.prisma.householdProfile.update({
      where: { id: user.householdProfile.id },
      data: dto,
    });

    await this.redis.del(this.userMeKey(firebaseUid));
    return householdProfileSchema.parse(profile);
  }
}
