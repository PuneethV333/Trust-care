import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const householdProfileInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  avatarUrl: z.string().url().optional(),
});

export class HouseholdOnboardingDto extends createZodDto(
  householdProfileInputSchema,
) {}

export class UpdateHouseholdProfileDto extends createZodDto(
  householdProfileInputSchema.partial(),
) {}
