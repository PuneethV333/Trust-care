import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PlanType, Role, ServiceType } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import {
  HelperProfileDto,
  HelperProfilePublicDto,
  SearchHelpersResponseDto,
  VerificationDocumentDto,
} from './dto/helper.dto';
import {
  HelperOnboardingDto,
  SearchHelpersQueryDto,
  UpdateAvailabilityDto,
  UpdateHelperProfileDto,
  UploadDocumentDto,
} from './dto/helper-input.dto';
import { HelpersService } from './helpers.service';

@ApiTags('helpers')
@Controller('helpers')
export class HelpersController {
  constructor(private readonly helpersService: HelpersService) {}

  @Post('onboarding')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete helper onboarding' })
  @ApiBody({ type: HelperOnboardingDto })
  @ApiResponse({
    status: 201,
    type: HelperProfileDto,
    description: 'The helper profile (user role set to HELPER)',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  completeOnboarding(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: HelperOnboardingDto,
  ): Promise<HelperProfileDto> {
    return this.helpersService.completeHelperOnboarding(user.firebaseUid, dto);
  }

  @Get('me')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get my helper profile' })
  @ApiResponse({ status: 200, type: HelperProfileDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Helper profile not found' })
  getMe(@CurrentUser() user: FirebaseUser): Promise<HelperProfileDto> {
    return this.helpersService.getMyHelperProfile(user.firebaseUid);
  }

  @Patch('me')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update my helper profile' })
  @ApiBody({ type: UpdateHelperProfileDto })
  @ApiResponse({ status: 200, type: HelperProfileDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Helper profile not found' })
  updateMe(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: UpdateHelperProfileDto,
  ): Promise<HelperProfileDto> {
    return this.helpersService.updateHelperProfile(user.firebaseUid, dto);
  }

  @Patch('me/availability')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update my availability' })
  @ApiBody({ type: UpdateAvailabilityDto })
  @ApiResponse({ status: 200, type: HelperProfileDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Helper profile not found' })
  updateAvailability(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<HelperProfileDto> {
    return this.helpersService.updateAvailability(
      user.firebaseUid,
      dto.availability,
    );
  }

  @Get()
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Search verified helpers' })
  @ApiQuery({ name: 'type', required: false, enum: ServiceType })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'minExperience', required: false, type: Number })
  @ApiQuery({ name: 'planType', required: false, enum: PlanType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, type: SearchHelpersResponseDto })
  search(
    @Query() query: SearchHelpersQueryDto,
  ): Promise<SearchHelpersResponseDto> {
    return this.helpersService.searchHelpers(query);
  }

  @Get(':id')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get a helper public profile' })
  @ApiResponse({ status: 200, type: HelperProfilePublicDto })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  getById(@Param('id') id: string): Promise<HelperProfilePublicDto> {
    return this.helpersService.getHelperById(id);
  }

  @Post('me/documents')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Upload a verification document' })
  @ApiBody({ type: UploadDocumentDto })
  @ApiResponse({ status: 201, type: VerificationDocumentDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Helper profile not found' })
  uploadDocument(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: UploadDocumentDto,
  ): Promise<VerificationDocumentDto> {
    return this.helpersService.uploadVerificationDocument(
      user.firebaseUid,
      dto,
    );
  }
}
