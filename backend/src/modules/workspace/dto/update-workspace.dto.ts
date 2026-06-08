import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Marketing', description: 'Workspace name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Marketing team workspace', description: 'Workspace description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
