import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { BookingStatus, Role } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  bookingResponseSchema,
  BookingResponse,
  CreateBookingDto,
} from './dto/booking.dto';

const BOOKINGS_CACHE_TTL = 30;

const bookingSelect = {
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
      user: { select: { firebaseUid: true } },
    },
  },
  household: {
    select: {
      id: true,
      fullName: true,
      user: { select: { firebaseUid: true } },
    },
  },
} satisfies Prisma.BookingSelect;

type BookingRow = Prisma.BookingGetPayload<{ select: typeof bookingSelect }>;

const MUTATION_SELECT = {
  id: true,
  status: true,
  helperId: true,
  householdId: true,
  helper: { select: { user: { select: { firebaseUid: true } } } },
  household: { select: { user: { select: { firebaseUid: true } } } },
} satisfies Prisma.BookingSelect;

type MutationRow = Prisma.BookingGetPayload<{
  select: typeof MUTATION_SELECT;
}>;

type BookingAction = 'accept' | 'reject' | 'cancel' | 'complete';

const ALLOWED_FROM: Record<BookingAction, BookingStatus[]> = {
  accept: [BookingStatus.PENDING],
  reject: [BookingStatus.PENDING],
  cancel: [BookingStatus.ACCEPTED, BookingStatus.ONGOING],
  complete: [BookingStatus.ACCEPTED, BookingStatus.ONGOING],
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private toBooking(booking: BookingRow): BookingResponse {
    return bookingResponseSchema.parse({
      ...booking,
      scheduledDate: booking.scheduledDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      servicePlan: booking.servicePlan
        ? { ...booking.servicePlan, price: Number(booking.servicePlan.price) }
        : null,
    });
  }

  private async invalidateBookings(...firebaseUids: string[]) {
    const unique = [...new Set(firebaseUids.filter(Boolean))];
    await Promise.all(
      unique.map((uid) => this.redis.del(`bookings:me:${uid}`)),
    );
  }

  private assertTransition(action: BookingAction, status: BookingStatus) {
    if (!ALLOWED_FROM[action].includes(status)) {
      throw new BadRequestException(
        `Cannot ${action} a booking in status ${status}`,
      );
    }
  }

  async createBooking(
    firebaseUid: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponse> {
    const household = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { householdProfile: { select: { id: true } } },
    });
    if (!household?.householdProfile) {
      throw new NotFoundException(
        'Household profile not found. Complete onboarding first.',
      );
    }

    const helper = await this.prisma.helperProfile.findUnique({
      where: { id: dto.helperId },
      select: { id: true, user: { select: { firebaseUid: true } } },
    });
    if (!helper) {
      throw new NotFoundException('Helper not found');
    }

    const plan = await this.prisma.servicePlan.findFirst({
      where: { id: dto.servicePlanId, helperId: dto.helperId },
      select: { id: true, isActive: true },
    });
    if (!plan) {
      throw new NotFoundException('Service plan not found for this helper');
    }
    if (!plan.isActive) {
      throw new BadRequestException('Service plan is not active');
    }

    const booking = await this.prisma.booking.create({
      data: {
        householdId: household.householdProfile.id,
        helperId: dto.helperId,
        servicePlanId: plan.id,
        scheduledDate: new Date(dto.scheduledDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        notes: dto.notes,
      },
      select: bookingSelect,
    });

    await this.invalidateBookings(firebaseUid, helper.user.firebaseUid);
    return this.toBooking(booking);
  }

  async getMyBookings(firebaseUid: string): Promise<BookingResponse[]> {
    const cacheKey = `bookings:me:${firebaseUid}`;
    const cached = await this.redis.get<BookingResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: {
        role: true,
        householdProfile: { select: { id: true } },
        helperProfile: { select: { id: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let where: Prisma.BookingWhereInput;
    if (user.role === Role.HOUSEHOLD) {
      if (!user.householdProfile) {
        return [];
      }
      where = { householdId: user.householdProfile.id };
    } else if (user.role === Role.HELPER) {
      if (!user.helperProfile) {
        return [];
      }
      where = { helperId: user.helperProfile.id };
    } else {
      throw new ForbiddenException('Role does not support bookings');
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: bookingSelect,
    });

    const result = bookings.map((booking) => this.toBooking(booking));
    await this.redis.set(cacheKey, result, BOOKINGS_CACHE_TTL);
    return result;
  }

  async getBookingById(
    firebaseUid: string,
    id: string,
  ): Promise<BookingResponse> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: {
        householdProfile: { select: { id: true } },
        helperProfile: { select: { id: true } },
      },
    });

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: bookingSelect,
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isHousehold = user?.householdProfile?.id === booking.householdId;
    const isHelper = user?.helperProfile?.id === booking.helperId;
    if (!isHousehold && !isHelper) {
      throw new ForbiddenException('Not a participant of this booking');
    }

    return this.toBooking(booking);
  }

  private async loadForMutation(id: string): Promise<MutationRow> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: MUTATION_SELECT,
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async transition(
    firebaseUid: string,
    id: string,
    action: BookingAction,
    target: BookingStatus,
    ownerCheck: (current: MutationRow) => void,
  ): Promise<BookingResponse> {
    const current = await this.loadForMutation(id);
    ownerCheck(current);
    this.assertTransition(action, current.status);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: target },
      select: bookingSelect,
    });

    await this.invalidateBookings(
      firebaseUid,
      current.helper?.user?.firebaseUid,
      current.household?.user?.firebaseUid,
    );
    if (
      target === BookingStatus.COMPLETED &&
      current.helper?.user?.firebaseUid
    ) {
      await this.redis.del(
        `helper:earnings:${current.helper.user.firebaseUid}`,
      );
    }
    return this.toBooking(updated);
  }

  async acceptBooking(
    firebaseUid: string,
    id: string,
  ): Promise<BookingResponse> {
    const helper = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { helperProfile: { select: { id: true } } },
    });
    if (!helper?.helperProfile) {
      throw new NotFoundException(
        'Helper profile not found. Complete onboarding first.',
      );
    }
    return this.transition(
      firebaseUid,
      id,
      'accept',
      BookingStatus.ACCEPTED,
      (current) => {
        if (current.helperId !== helper.helperProfile!.id) {
          throw new ForbiddenException('Not the helper for this booking');
        }
      },
    );
  }

  async rejectBooking(
    firebaseUid: string,
    id: string,
  ): Promise<BookingResponse> {
    const helper = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { helperProfile: { select: { id: true } } },
    });
    if (!helper?.helperProfile) {
      throw new NotFoundException(
        'Helper profile not found. Complete onboarding first.',
      );
    }
    return this.transition(
      firebaseUid,
      id,
      'reject',
      BookingStatus.REJECTED,
      (current) => {
        if (current.helperId !== helper.helperProfile!.id) {
          throw new ForbiddenException('Not the helper for this booking');
        }
      },
    );
  }

  async cancelBooking(
    firebaseUid: string,
    id: string,
  ): Promise<BookingResponse> {
    const household = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { householdProfile: { select: { id: true } } },
    });
    if (!household?.householdProfile) {
      throw new NotFoundException(
        'Household profile not found. Complete onboarding first.',
      );
    }
    return this.transition(
      firebaseUid,
      id,
      'cancel',
      BookingStatus.CANCELLED,
      (current) => {
        if (current.householdId !== household.householdProfile!.id) {
          throw new ForbiddenException('Not the household for this booking');
        }
      },
    );
  }

  async completeBooking(
    firebaseUid: string,
    id: string,
  ): Promise<BookingResponse> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { role: true, helperProfile: { select: { id: true } } },
    });

    const ownerCheck = (current: MutationRow) => {
      if (user?.role === Role.HELPER) {
        if (!user.helperProfile || current.helperId !== user.helperProfile.id) {
          throw new ForbiddenException('Not the helper for this booking');
        }
      } else if (user?.role !== Role.ADMIN) {
        throw new ForbiddenException('Insufficient role');
      }
    };

    return this.transition(
      firebaseUid,
      id,
      'complete',
      BookingStatus.COMPLETED,
      ownerCheck,
    );
  }
}
