import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import {
  HouseholdOnboardingDto,
  UpdateHouseholdProfileDto,
} from './dto/household-profile.dto';
import { CurrentUserDto, HouseholdProfileDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboarding')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete household onboarding' })
  @ApiBody({ type: HouseholdOnboardingDto })
  @ApiResponse({
    status: 201,
    type: CurrentUserDto,
    description: 'The current user with household profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  completeOnboarding(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: HouseholdOnboardingDto,
  ): Promise<CurrentUserDto> {
    return this.usersService.completeHouseholdOnboarding(user.firebaseUid, dto);
  }

  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get the current user' })
  @ApiResponse({
    status: 200,
    type: CurrentUserDto,
    description: 'The current user with profiles',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  getCurrentUser(@CurrentUser() user: FirebaseUser): Promise<CurrentUserDto> {
    return this.usersService.getCurrentUser(user.firebaseUid);
  }

  @Patch('me')
  @Roles(Role.HOUSEHOLD)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update the household profile' })
  @ApiBody({ type: UpdateHouseholdProfileDto })
  @ApiResponse({
    status: 200,
    type: HouseholdProfileDto,
    description: 'The updated household profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Household profile not found' })
  updateHouseholdProfile(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: UpdateHouseholdProfileDto,
  ): Promise<HouseholdProfileDto> {
    return this.usersService.updateHouseholdProfile(user.firebaseUid, dto);
  }
}
