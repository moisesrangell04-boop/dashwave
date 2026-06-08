import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';
import { LeadStatus, LeadPriority } from './create-lead.dto';

export class QueryLeadDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by pipeline ID' })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Filter by stage ID' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Search query (title)' })
  @IsOptional()
  @IsString()
  q?: string;
}
