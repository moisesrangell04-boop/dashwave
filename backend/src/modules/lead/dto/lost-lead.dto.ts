import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LostLeadDto {
  @ApiPropertyOptional({ example: 'Budget too low', description: 'Reason for losing the lead' })
  @IsOptional()
  @IsString()
  reason?: string;
}
