import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import {
  CreateServicePlanDto,
  ServicePlanDto,
  UpdateServicePlanDto,
} from './dto/service-plan.dto';
import { ServicePlansService } from './service-plans.service';

@ApiTags('service-plans')
@Controller('service-plans')
export class ServicePlansController {
  constructor(private readonly servicePlansService: ServicePlansService) {}

  @Post()
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a service plan' })
  @ApiBody({ type: CreateServicePlanDto })
  @ApiResponse({
    status: 201,
    type: ServicePlanDto,
    description: 'The created plan',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Helper profile not found' })
  create(
    @CurrentUser() user: FirebaseUser,
    @Body() dto: CreateServicePlanDto,
  ): Promise<ServicePlanDto> {
    return this.servicePlansService.createServicePlan(user.firebaseUid, dto);
  }

  @Get('helper/:helperId')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'List a helper service plans' })
  @ApiResponse({
    status: 200,
    type: ServicePlanDto,
    isArray: true,
    description: 'The helper service plans',
  })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  getByHelper(@Param('helperId') helperId: string): Promise<ServicePlanDto[]> {
    return this.servicePlansService.getPlansByHelper(helperId);
  }

  @Patch(':id')
  @Roles(Role.HELPER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update a service plan' })
  @ApiBody({ type: UpdateServicePlanDto })
  @ApiResponse({
    status: 200,
    type: ServicePlanDto,
    description: 'The updated plan',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not the owner',
  })
  @ApiResponse({ status: 404, description: 'Service plan not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
    @Body() dto: UpdateServicePlanDto,
  ): Promise<ServicePlanDto> {
    return this.servicePlansService.updateServicePlan(
      id,
      user.firebaseUid,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.HELPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Delete a service plan' })
  @ApiResponse({ status: 204, description: 'Service plan deleted' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or not the owner',
  })
  @ApiResponse({ status: 404, description: 'Service plan not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: FirebaseUser,
  ): Promise<void> {
    await this.servicePlansService.deleteServicePlan(id, user.firebaseUid);
  }
}
