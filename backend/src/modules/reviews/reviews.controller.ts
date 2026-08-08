import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { CreateReviewDto, ReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.HOUSEHOLD)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Review a completed booking' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: 201,
    type: ReviewDto,
    description: 'The created review',
  })
  @ApiResponse({
    status: 400,
    description: 'Booking not completed or invalid rating',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Not the household for this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Household profile or booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Review already exists for this booking',
  })
  create(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewsService.createReview(user.firebaseUid, dto);
  }

  @Get('helper/:helperId')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'List reviews for a helper' })
  @ApiResponse({
    status: 200,
    type: ReviewDto,
    isArray: true,
    description: 'The helper reviews',
  })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  getByHelper(@Param('helperId') helperId: string): Promise<ReviewDto[]> {
    return this.reviewsService.getHelperReviews(helperId);
  }
}
