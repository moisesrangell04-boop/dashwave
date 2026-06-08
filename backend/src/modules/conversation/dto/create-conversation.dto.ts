import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  urgent = 'urgent',
}

export class CreateConversationDto {
  @ApiProperty({ example: 'uuid-contact-id', description: 'Contact ID' })
  @IsString()
  contactId: string;

  @ApiProperty({ example: 'uuid-instance-id', description: 'WhatsApp instance ID' })
  @IsString()
  whatsappInstanceId: string;

  @ApiPropertyOptional({ example: 'Support request', description: 'Conversation subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ enum: ConversationPriority, default: 'medium', description: 'Conversation priority' })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({ example: ['support', 'urgent'], description: 'Conversation tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
