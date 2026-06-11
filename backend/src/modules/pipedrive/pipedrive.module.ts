import { Module } from '@nestjs/common';
import { PipedriveController } from './pipedrive.controller';
import { PipedriveService } from './pipedrive.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  controllers: [PipedriveController],
  providers: [PipedriveService, PrismaService],
  exports: [PipedriveService],
})
export class PipedriveModule {}
