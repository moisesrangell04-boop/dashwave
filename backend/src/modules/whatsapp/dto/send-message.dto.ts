import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '5511999999999', description: 'Destination phone number' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Hello, this is a test message!', description: 'Message text content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @ApiPropertyOptional({ example: 'text', description: 'Message type' })
  @IsOptional()
  @IsString()
  type?: string;
}
