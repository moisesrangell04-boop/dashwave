import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';

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

export class QueryConversationDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ConversationStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ enum: ConversationPriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Search query (matches subject or lastMessage)' })
  @IsOptional()
  @IsString()
  q?: string;
}
