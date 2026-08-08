import { z } from 'zod';

export const uploadSignatureInputSchema = z.object({
  folder: z.string().min(1).max(100).optional(),
});

export const cloudinarySignatureResponseSchema = z.object({
  timestamp: z.number().int(),
  signature: z.string(),
  apiKey: z.string(),
  cloudName: z.string(),
  folder: z.string(),
});

export type CloudinarySignature = z.infer<typeof cloudinarySignatureResponseSchema>;
