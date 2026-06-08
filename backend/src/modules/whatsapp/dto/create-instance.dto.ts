import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WhatsAppProvider {
  evolution = 'evolution',
  meta_cloud = 'meta_cloud',
}

export class CreateInstanceDto {
  @ApiProperty({ example: 'Sales Team', description: 'Instance display name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '5511999999999', description: 'WhatsApp phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ enum: WhatsAppProvider, example: 'evolution', description: 'WhatsApp provider' })
  @IsEnum(WhatsAppProvider)
  provider: WhatsAppProvider;

  @ApiPropertyOptional({ example: 'http://evolution-api:8080', description: 'Custom Evolution API server URL' })
  @IsOptional()
  @IsString()
  serverUrl?: string;

  @ApiPropertyOptional({ example: 'ev-abc123', description: 'API key for the provider' })
  @IsOptional()
  @IsString()
  apikey?: string;
}
