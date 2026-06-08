import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  controllers: [LeadController],
  providers: [LeadService, PrismaService],
  exports: [LeadService],
})
export class LeadModule {}
