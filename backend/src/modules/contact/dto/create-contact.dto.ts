import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Contact name' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '+5511999999999', description: 'Contact phone number' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Contact avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: ['vip', 'lead'], description: 'Contact tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Met at conference', description: 'Notes about the contact' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: { company: 'Acme Inc', position: 'CEO' }, description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
