import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  getCloudinaryConfig,
  type CloudinaryConfig,
} from '../../config/cloudinary.config';
import { CloudinarySignatureDto } from './dto/upload.dto';

const DEFAULT_FOLDER = 'helper4u';

@Injectable()
export class UploadsService {
  getCloudinarySignature(folder?: string): CloudinarySignatureDto {
    let config: CloudinaryConfig;
    try {
      config = getCloudinaryConfig();
    } catch {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = { timestamp, folder: folder ?? DEFAULT_FOLDER };

    const toSign =
      Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&') + `&${config.apiSecret}`;

    const signature = createHash('sha1').update(toSign).digest('hex');

    return {
      timestamp,
      signature,
      apiKey: config.apiKey,
      cloudName: config.cloudName,
      folder: params.folder,
    };
  }
}
