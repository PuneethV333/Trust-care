import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PlanType } from '../../../../generated/prisma/enums';

export const servicePlanSchema = z.object({
  id: z.string().uuid(),
  helperId: z.string().uuid(),
  planType: z.nativeEnum(PlanType),
  price: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});

export const createServicePlanInputSchema = z.object({
  planType: z.nativeEnum(PlanType),
  price: z.number().nonnegative(),
  description: z.string().max(500).optional(),
});

export const updateServicePlanInputSchema =
  createServicePlanInputSchema.partial();

export type ServicePlanResponse = z.infer<typeof servicePlanSchema>;

export class ServicePlanDto extends createZodDto(servicePlanSchema) {}
export class CreateServicePlanDto extends createZodDto(
  createServicePlanInputSchema,
) {}
export class UpdateServicePlanDto extends createZodDto(
  updateServicePlanInputSchema,
) {}
