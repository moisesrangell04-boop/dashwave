import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, MessageOrigin } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({ example: 'uuid-conversation-id', description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.text, description: 'Message type' })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiProperty({ example: 'Hello, how can I help you?', description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Media URL' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Media MIME type' })
  @IsOptional()
  @IsString()
  mediaMimeType?: string;

  @ApiPropertyOptional({ description: 'Media file size in bytes' })
  @IsOptional()
  @IsNumber()
  mediaSize?: number;

  @ApiPropertyOptional({ description: 'Media file name' })
  @IsOptional()
  @IsString()
  mediaName?: string;

  @ApiPropertyOptional({ description: 'Quoted message ID for replies' })
  @IsOptional()
  @IsString()
  quotedMessageId?: string;

  @ApiPropertyOptional({ enum: MessageOrigin, default: MessageOrigin.human, description: 'Message origin' })
  @IsOptional()
  @IsEnum(MessageOrigin)
  origin?: MessageOrigin;
}
