import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  CreateServicePlanDto,
  servicePlanSchema,
  ServicePlanResponse,
  UpdateServicePlanDto,
} from './dto/service-plan.dto';

const PLANS_CACHE_TTL = 300;

@Injectable()
export class ServicePlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private readonly planSelect = {
    id: true,
    helperId: true,
    planType: true,
    price: true,
    description: true,
    isActive: true,
  } as const;

  private toPlan(plan: { price: unknown }): ServicePlanResponse {
    return servicePlanSchema.parse({ ...plan, price: Number(plan.price) });
  }

  private async findHelperIdByFirebaseUid(firebaseUid: string) {
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

  private async findOwnedPlan(id: string, helperId: string) {
    const plan = await this.prisma.servicePlan.findUnique({
      where: { id },
      select: { id: true, helperId: true },
    });
    if (!plan) {
      throw new NotFoundException('Service plan not found');
    }
    if (plan.helperId !== helperId) {
      throw new ForbiddenException('You do not own this service plan');
    }
    return plan;
  }

  private async invalidatePlans(helperId: string) {
    await this.redis.del(`service-plans:helper:${helperId}`);
    await this.redis.del(`helper:profile:${helperId}`);
  }

  async createServicePlan(
    firebaseUid: string,
    dto: CreateServicePlanDto,
  ): Promise<ServicePlanResponse> {
    const helper = await this.findHelperIdByFirebaseUid(firebaseUid);
    const plan = await this.prisma.servicePlan.create({
      data: {
        helperId: helper.id,
        planType: dto.planType,
        price: dto.price,
        description: dto.description,
      },
      select: this.planSelect,
    });

    await this.invalidatePlans(helper.id);
    return this.toPlan(plan);
  }

  async getPlansByHelper(helperId: string): Promise<ServicePlanResponse[]> {
    const cacheKey = `service-plans:helper:${helperId}`;
    const cached = await this.redis.get<ServicePlanResponse[]>(cacheKey);
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

    const plans = await this.prisma.servicePlan.findMany({
      where: { helperId },
      orderBy: { createdAt: 'desc' },
      select: this.planSelect,
    });

    const result = plans.map((plan) => this.toPlan(plan));
    await this.redis.set(cacheKey, result, PLANS_CACHE_TTL);
    return result;
  }

  async updateServicePlan(
    id: string,
    firebaseUid: string,
    dto: UpdateServicePlanDto,
  ): Promise<ServicePlanResponse> {
    const helper = await this.findHelperIdByFirebaseUid(firebaseUid);
    const plan = await this.findOwnedPlan(id, helper.id);

    const updated = await this.prisma.servicePlan.update({
      where: { id: plan.id },
      data: dto,
      select: this.planSelect,
    });

    await this.invalidatePlans(helper.id);
    return this.toPlan(updated);
  }

  async deleteServicePlan(id: string, firebaseUid: string): Promise<void> {
    const helper = await this.findHelperIdByFirebaseUid(firebaseUid);
    const plan = await this.findOwnedPlan(id, helper.id);

    await this.prisma.servicePlan.delete({ where: { id: plan.id } });
    await this.invalidatePlans(helper.id);
  }
}
