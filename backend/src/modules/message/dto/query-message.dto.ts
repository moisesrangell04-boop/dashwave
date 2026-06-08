import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';
import { MessageDirection, MessageOrigin, MessageType } from '@prisma/client';

export class QueryMessageDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by conversation ID' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ enum: MessageDirection, description: 'Filter by direction' })
  @IsOptional()
  @IsEnum(MessageDirection)
  direction?: MessageDirection;

  @ApiPropertyOptional({ enum: MessageOrigin, description: 'Filter by origin' })
  @IsOptional()
  @IsEnum(MessageOrigin)
  origin?: MessageOrigin;

  @ApiPropertyOptional({ enum: MessageType, description: 'Filter by message type' })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
