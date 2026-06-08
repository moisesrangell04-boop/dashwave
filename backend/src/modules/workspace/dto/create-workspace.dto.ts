import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Marketing', description: 'Workspace name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Marketing team workspace', description: 'Workspace description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
