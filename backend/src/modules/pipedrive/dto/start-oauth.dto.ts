import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartOAuthDto {
  @ApiPropertyOptional({ description: 'Pipedrive company domain' })
  @IsString()
  @IsOptional()
  companyDomain?: string;
}
