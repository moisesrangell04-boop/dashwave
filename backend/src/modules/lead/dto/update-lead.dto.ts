import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadPriority } from './create-lead.dto';

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'New business deal', description: 'Lead title' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Lead value' })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({ example: ['vip', 'hot'], description: 'Lead tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Client interested in premium plan', description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Expected close date' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;
}
