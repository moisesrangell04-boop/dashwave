import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStageDto {
  @ApiPropertyOptional({ example: 'New Lead', description: 'Stage name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '#6366f1', description: 'Stage color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 20, description: 'Win probability 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  winProbability?: number;

  @ApiPropertyOptional({ description: 'Mark as final stage' })
  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;
}
