import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageStatus } from '@prisma/client';

export class UpdateMessageDto {
  @ApiPropertyOptional({ enum: MessageStatus, description: 'Message status' })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
