import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Tenant name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'https://logo.cdn.com/logo.png', description: 'Tenant logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: '#2563eb', description: 'Primary brand color' })
  @IsOptional()
  @IsString()
  primaryColor?: string;
}
