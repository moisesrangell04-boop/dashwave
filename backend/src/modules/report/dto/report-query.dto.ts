import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date for report range (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report range (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Grouping interval', enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';
}
