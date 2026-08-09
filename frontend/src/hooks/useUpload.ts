import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { api, ApiError } from '../lib/api';
import {
  documentSchema,
  uploadDocumentInputSchema,
  type VerificationDocument,
} from '../schemas/helper.schema';

type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

export function useUploadVerificationDocument() {
  const queryClient = useQueryClient();

  return useMutation<VerificationDocument, ApiError, UploadDocumentInput>({
    mutationFn: async (input) => {
      const parsed = uploadDocumentInputSchema.parse(input);
      const data = await api.post<unknown>('/helpers/me/documents', parsed);
      return documentSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['helpers', 'me'] });
    },
  });
}