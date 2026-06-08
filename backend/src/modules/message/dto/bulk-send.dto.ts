import { IsArray, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class BulkSendDto {
  @ApiProperty({ example: ['uuid-contact-1', 'uuid-contact-2'], description: 'Contact IDs to send the message to' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  contactIds: string[];

  @ApiProperty({ example: 'Important announcement for all customers', description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.text, description: 'Message type' })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
