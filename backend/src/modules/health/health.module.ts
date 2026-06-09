import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { RedisCacheService } from '../../infra/cache/redis-cache.service';

@Module({
  controllers: [HealthController],
  providers: [PrismaService, RedisCacheService],
})
export class HealthModule {}
