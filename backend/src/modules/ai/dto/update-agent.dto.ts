import { IsString, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentConfig, AgentTriggers } from './create-agent.dto';

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'Support Bot v2', description: 'Agent name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Handles first-line support', description: 'Agent description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'AI provider configuration (partial)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfig)
  @IsObject()
  config?: AgentConfig;

  @ApiPropertyOptional({ description: 'Trigger configuration (partial)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentTriggers)
  @IsObject()
  triggers?: AgentTriggers;
}
