import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePipelineDto {
  @ApiPropertyOptional({ example: 'Sales Pipeline', description: 'Pipeline name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Main sales pipeline', description: 'Pipeline description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
