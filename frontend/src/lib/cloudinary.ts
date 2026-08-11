import { cloudinarySignatureResponseSchema } from '../schemas/upload.schema';
import { api } from './api';

const UPLOAD_BASE_URL = 'https://api.cloudinary.com/v1_1/';

export async function uploadToCloudinary(file: File): Promise<string> {
  const raw = await api.post<unknown>('/uploads/signature', {});
  const { timestamp, signature, apiKey, cloudName, folder } =
    cloudinarySignatureResponseSchema.parse(raw);

  const form = new FormData();
  form.append('file', file);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('api_key', apiKey);
  form.append('cloud_name', cloudName);
  form.append('folder', folder);

  let response: Response;
  try {
    response = await fetch(`${UPLOAD_BASE_URL}${cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error('Upload failed — please check your connection.');
  }

  if (!response.ok) {
    let message = 'Upload failed — please try again.';
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { secure_url?: unknown };
  if (typeof data.secure_url !== 'string') {
    throw new Error('Upload failed — please try again.');
  }
  return data.secure_url;
}