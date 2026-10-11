import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/trust_care',
      max: 10,
      connectionTimeoutMillis: 30_000,
      idleTimeoutMillis: 30_000,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    // Warm the pool so the first request doesn't race a cold Neon connect
    // (which can exceed Prisma's transaction acquire timeout -> P2028).
    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
