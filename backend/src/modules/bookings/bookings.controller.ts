import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { BookingsService } from './bookings.service';
import { BookingDto, CreateBookingDto } from './dto/booking.dto';
import { CreateDisputeDto, DisputeDto } from './dto/dispute.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.HOUSEHOLD)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a booking for a helper service plan' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: 201,
    type: BookingDto,
    description: 'The created booking',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({
    status: 404,
    description: 'Household profile, helper, or service plan not found',
  })
  @ApiResponse({ status: 400, description: 'Service plan is not active' })
  create(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingDto> {
    return this.bookingsService.createBooking(user.firebaseUid, dto);
  }

  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get current user bookings (role-aware)' })
  @ApiResponse({
    status: 200,
    type: BookingDto,
    isArray: true,
    description: 'Bookings for the current user',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Role does not support bookings' })
  getMy(@CurrentUser() user: FirebaseUser): Promise<BookingDto[]> {
    return this.bookingsService.getMyBookings(user.firebaseUid);
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get a booking by id (participants only)' })
  @ApiResponse({ status: 200, type: BookingDto, description: 'The booking' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Not a participant of this booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  getById(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
  ): Promise<BookingDto> {
    return this.bookingsService.getBookingById(user.firebaseUid, id);
  }

  @Patch(':id/accept')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Accept a pending booking' })
  @ApiResponse({
    status: 200,
    type: BookingDto,
    description: 'The updated booking',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not the helper',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  accept(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
  ): Promise<BookingDto> {
    return this.bookingsService.acceptBooking(user.firebaseUid, id);
  }

  @Patch(':id/reject')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reject a pending booking' })
  @ApiResponse({
    status: 200,
    type: BookingDto,
    description: 'The updated booking',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not the helper',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
  ): Promise<BookingDto> {
    return this.bookingsService.rejectBooking(user.firebaseUid, id);
  }

  @Patch(':id/cancel')
  @Roles(Role.HOUSEHOLD)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cancel an accepted or ongoing booking' })
  @ApiResponse({
    status: 200,
    type: BookingDto,
    description: 'The updated booking',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not the household',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
  ): Promise<BookingDto> {
    return this.bookingsService.cancelBooking(user.firebaseUid, id);
  }

  @Patch(':id/complete')
  @Roles(Role.HELPER, Role.ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete an accepted or ongoing booking' })
  @ApiResponse({
    status: 200,
    type: BookingDto,
    description: 'The updated booking',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not the helper',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
  ): Promise<BookingDto> {
    return this.bookingsService.completeBooking(user.firebaseUid, id);
  }

  @Post(':id/dispute')
  @Roles(Role.HOUSEHOLD, Role.HELPER)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Report an issue for a completed or cancelled booking',
  })
  @ApiBody({ type: CreateDisputeDto })
  @ApiResponse({
    status: 201,
    type: DisputeDto,
    description: 'The created dispute',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking state or dispute already open',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not a participant',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  reportDispute(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
    @Body() dto: CreateDisputeDto,
  ): Promise<DisputeDto> {
    return this.bookingsService.createDispute(user.firebaseUid, id, dto.reason);
  }
}
