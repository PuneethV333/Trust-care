import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DisputeStatus, Role } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  DisputesListQueryDto,
  PaginatedDisputesDto,
  ResolveDisputeDto,
} from '../bookings/dto/dispute.dto';
import { AdminService } from './admin.service';
import {
  AdminAnalyticsDto,
  AdminHelperDto,
  BookingsListQueryDto,
  PaginatedBookingsDto,
  PaginatedUsersDto,
  UsersListQueryDto,
} from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('helpers/pending')
  @Throttle({ default: { limit: 50, ttl: 60_000 } })
  @ApiOperation({ summary: 'List helpers pending verification' })
  @ApiResponse({
    status: 200,
    type: AdminHelperDto,
    isArray: true,
    description: 'Pending helpers, oldest first',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getPendingHelpers(): Promise<AdminHelperDto[]> {
    return this.adminService.getPendingHelpers();
  }

  @Patch('helpers/:id/verify')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Mark a helper as verified' })
  @ApiResponse({
    status: 200,
    type: AdminHelperDto,
    description: 'The updated helper',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  verifyHelper(@Param('id') id: string): Promise<AdminHelperDto> {
    return this.adminService.verifyHelper(id);
  }

  @Patch('helpers/:id/reject')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reject a helper verification' })
  @ApiResponse({
    status: 200,
    type: AdminHelperDto,
    description: 'The updated helper',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  rejectHelper(@Param('id') id: string): Promise<AdminHelperDto> {
    return this.adminService.rejectHelper(id);
  }

  @Get('users')
  @Throttle({ default: { limit: 50, ttl: 60_000 } })
  @ApiOperation({ summary: 'List users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedUsersDto,
    description: 'Paginated users',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  listUsers(@Query() query: UsersListQueryDto): Promise<PaginatedUsersDto> {
    return this.adminService.listUsers(query);
  }

  @Get('bookings')
  @Throttle({ default: { limit: 50, ttl: 60_000 } })
  @ApiOperation({ summary: 'List all bookings (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'ONGOING',
      'COMPLETED',
      'CANCELLED',
    ],
  })
  @ApiResponse({
    status: 200,
    type: PaginatedBookingsDto,
    description: 'Paginated bookings',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  listAllBookings(
    @Query() query: BookingsListQueryDto,
  ): Promise<PaginatedBookingsDto> {
    return this.adminService.listAllBookings(query);
  }

  @Get('disputes')
  @Throttle({ default: { limit: 50, ttl: 60_000 } })
  @ApiOperation({ summary: 'List disputes (paginated, filterable)' })
  @ApiQuery({ name: 'status', required: false, enum: DisputeStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedDisputesDto,
    description: 'Paginated disputes',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  listDisputes(
    @Query() query: DisputesListQueryDto,
  ): Promise<PaginatedDisputesDto> {
    return this.adminService.listDisputes(query);
  }

  @Patch('disputes/:id/resolve')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Resolve or dismiss a dispute' })
  @ApiBody({ type: ResolveDisputeDto })
  @ApiResponse({
    status: 200,
    type: DisputesListQueryDto,
    description: 'The updated dispute',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.adminService.resolveDispute(id, dto.status, dto.resolution);
  }

  @Get('analytics')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Platform analytics' })
  @ApiResponse({
    status: 200,
    type: AdminAnalyticsDto,
    description: 'Aggregate platform counts',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getAnalytics(): Promise<AdminAnalyticsDto> {
    return this.adminService.getPlatformAnalytics();
  }
}
