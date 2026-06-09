import { IsString, IsOptional, IsBoolean, IsDateString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryApiKeyDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
