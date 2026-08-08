import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CloudinarySignatureDto,
  UploadSignatureInputDto,
} from './dto/upload.dto';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('signature')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get a signed Cloudinary upload signature' })
  @ApiBody({
    type: UploadSignatureInputDto,
    description: 'Optional upload folder',
  })
  @ApiResponse({
    status: 201,
    type: CloudinarySignatureDto,
    description: 'Signature for a direct browser upload to Cloudinary',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 503, description: 'Cloudinary is not configured' })
  getSignature(@Body() dto: UploadSignatureInputDto): CloudinarySignatureDto {
    return this.uploadsService.getCloudinarySignature(dto.folder);
  }
}
