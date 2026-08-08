import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role, VerificationStatus } from '../../../../generated/prisma/enums';

export const householdProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  avatarUrl: z.string().nullable(),
});

export const helperProfileSummarySchema = z.object({
  id: z.string().uuid(),
  verificationStatus: z.nativeEnum(VerificationStatus),
});

export const currentUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  role: z.nativeEnum(Role),
  onboardingCompleted: z.boolean(),
  householdProfile: householdProfileSchema.nullable(),
  helperProfile: helperProfileSummarySchema.nullable(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type HouseholdProfile = z.infer<typeof householdProfileSchema>;

export class CurrentUserDto extends createZodDto(currentUserSchema) {}
export class HouseholdProfileDto extends createZodDto(householdProfileSchema) {}
