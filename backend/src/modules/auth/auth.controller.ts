import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { AuthService } from './auth.service';
import { SyncUserResponseDto } from './dto/sync-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sync the signed-in Firebase user' })
  @ApiResponse({
    status: 201,
    type: SyncUserResponseDto,
    description: 'The synced user (created if new)',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Firebase token',
  })
  sync(@CurrentUser() user: FirebaseUser): Promise<SyncUserResponseDto> {
    return this.authService.sync(user);
  }
}
