import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { SyncUserResponse } from './dto/sync-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(firebaseUser: FirebaseUser): Promise<SyncUserResponse> {
    return this.prisma.user.upsert({
      where: { firebaseUid: firebaseUser.firebaseUid },
      create: {
        firebaseUid: firebaseUser.firebaseUid,
        email: firebaseUser.email ?? '',
      },
      update: {
        email: firebaseUser.email ?? '',
      },
      select: {
        id: true,
        role: true,
        onboardingCompleted: true,
      },
    });
  }
}
