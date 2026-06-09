import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { RedisCacheService } from '../../infra/cache/redis-cache.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check — DB and Redis status' })
  async check() {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};
    let healthy = true;

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
    } catch {
      checks.database = { status: 'error' };
      healthy = false;
    }

    const redisStart = Date.now();
    try {
      await this.cache.set('health:ping', '1', 5);
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
    } catch {
      checks.redis = { status: 'error' };
      healthy = false;
    }

    return {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
