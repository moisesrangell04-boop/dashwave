import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [AiService, PrismaService],
  exports: [AiService],
})
export class AiModule {}
