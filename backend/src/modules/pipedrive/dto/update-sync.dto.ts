import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSyncDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  syncContacts?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  syncLeads?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  syncPipelines?: boolean;
}
