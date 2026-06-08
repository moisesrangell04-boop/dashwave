import { IsString, IsOptional, IsObject, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInstanceDto {
  @ApiPropertyOptional({ example: 'Support Team', description: 'Instance display name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'http://evolution-api:8080', description: 'Custom Evolution API server URL' })
  @IsOptional()
  @IsString()
  serverUrl?: string;

  @ApiPropertyOptional({ example: 'ev-abc123', description: 'API key for the provider' })
  @IsOptional()
  @IsString()
  apikey?: string;

  @ApiPropertyOptional({ description: 'Instance settings as JSON object' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
