import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateStageDto {
  @ApiProperty({ example: 'New Lead', description: 'Stage name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

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
}

export class CreatePipelineDto {
  @ApiProperty({ example: 'Sales Pipeline', description: 'Pipeline name' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Main sales pipeline', description: 'Pipeline description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    type: [CreateStageDto],
    description: 'Initial stages for the pipeline',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages?: CreateStageDto[];
}
