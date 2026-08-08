import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from '../../../../generated/prisma/enums';

export const syncUserResponseSchema = z.object({
  id: z.string().uuid(),
  role: z.nativeEnum(Role),
  onboardingCompleted: z.boolean(),
});

export type SyncUserResponse = z.infer<typeof syncUserResponseSchema>;

export class SyncUserResponseDto extends createZodDto(syncUserResponseSchema) {}
