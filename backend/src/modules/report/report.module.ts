import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
  exports: [ReportService],
})
export class ReportModule {}
