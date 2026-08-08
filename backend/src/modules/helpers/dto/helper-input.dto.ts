import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PlanType, ServiceType } from '../../../../generated/prisma/enums';
import { availabilitySchema } from './helper.dto';

export const helperOnboardingInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  serviceType: z.nativeEnum(ServiceType),
  experienceYears: z.number().int().min(0).max(60),
  bio: z.string().max(1000).optional(),
  city: z.string().trim().min(2),
  avatarUrl: z.string().url().optional(),
  availability: availabilitySchema.optional(),
});

export const updateHelperProfileInputSchema = helperOnboardingInputSchema
  .pick({
    fullName: true,
    phone: true,
    serviceType: true,
    experienceYears: true,
    bio: true,
    city: true,
    avatarUrl: true,
  })
  .partial();

export const updateAvailabilityInputSchema = z.object({
  availability: availabilitySchema,
});

export const uploadDocumentInputSchema = z.object({
  docType: z.string().trim().min(2),
  url: z.string().url(),
});

export const searchHelpersQuerySchema = z.object({
  type: z.nativeEnum(ServiceType).optional(),
  city: z.string().trim().min(1).optional(),
  minExperience: z.coerce.number().int().min(0).optional(),
  planType: z.nativeEnum(PlanType).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type SearchHelpersQuery = z.infer<typeof searchHelpersQuerySchema>;

export class HelperOnboardingDto extends createZodDto(
  helperOnboardingInputSchema,
) {}
export class UpdateHelperProfileDto extends createZodDto(
  updateHelperProfileInputSchema,
) {}
export class UpdateAvailabilityDto extends createZodDto(
  updateAvailabilityInputSchema,
) {}
export class UploadDocumentDto extends createZodDto(
  uploadDocumentInputSchema,
) {}
export class SearchHelpersQueryDto extends createZodDto(
  searchHelpersQuerySchema,
) {}
