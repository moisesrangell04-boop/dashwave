import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationStatus {
  active = 'active',
  pending = 'pending',
  waiting = 'waiting',
  resolved = 'resolved',
  closed = 'closed',
}

export enum ConversationPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  urgent = 'urgent',
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatus, description: 'Conversation status' })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ enum: ConversationPriority, description: 'Conversation priority' })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({ example: 'Updated subject', description: 'Conversation subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: ['support', 'billing'], description: 'Conversation tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
