import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeadSource {
  whatsapp = 'whatsapp',
  webchat = 'webchat',
  manual = 'manual',
  import = 'import',
  api = 'api',
  referral = 'referral',
  website = 'website',
  social_media = 'social_media',
  email = 'email',
  other = 'other',
}

export enum LeadStatus {
  active = 'active',
  converted = 'converted',
  lost = 'lost',
  archived = 'archived',
}

export enum LeadPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export class CreateLeadDto {
  @ApiProperty({ description: 'Pipeline ID' })
  @IsString()
  pipelineId: string;

  @ApiProperty({ description: 'Stage ID within the pipeline' })
  @IsString()
  stageId: string;

  @ApiProperty({ description: 'Contact ID' })
  @IsString()
  contactId: string;

  @ApiProperty({ example: 'New business deal', description: 'Lead title' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 5000, description: 'Lead value' })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ enum: LeadSource, default: 'manual' })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ enum: LeadPriority, default: 'medium' })
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
