import { IsString, IsOptional, IsEnum, IsNumber, IsArray, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AIProvider {
  openai = 'openai',
  anthropic = 'anthropic',
  gemini = 'gemini',
}

export enum AIPersonality {
  friendly = 'friendly',
  professional = 'professional',
  casual = 'casual',
  formal = 'formal',
  custom = 'custom',
}

export enum TriggerType {
  all_messages = 'all_messages',
  unassigned = 'unassigned',
  after_hours = 'after_hours',
  keywords = 'keywords',
  specific_contacts = 'specific_contacts',
}

export class AgentConfig {
  @ApiPropertyOptional({ enum: AIProvider, description: 'AI provider' })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @ApiPropertyOptional({ example: 'gpt-4o', description: 'Model name' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 0.7, description: 'Temperature (0-2)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ example: 2048, description: 'Max tokens for response' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ example: 'You are a helpful support agent...', description: 'System prompt for the AI' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ enum: AIPersonality, default: AIPersonality.friendly, description: 'Agent personality' })
  @IsOptional()
  @IsEnum(AIPersonality)
  personality?: AIPersonality;

  @ApiPropertyOptional({ example: 'Always greet the customer...', description: 'Custom instructions override' })
  @IsOptional()
  @IsString()
  customInstructions?: string;

  @ApiPropertyOptional({ example: 'pt-BR', description: 'Response language' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class AgentTriggers {
  @ApiProperty({ enum: TriggerType, description: 'Trigger type' })
  @IsEnum(TriggerType)
  type: TriggerType;

  @ApiPropertyOptional({ example: ['help', 'support', 'human'], description: 'Keywords to trigger agent' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ example: ['uuid-contact-id'], description: 'Specific contact IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[];

  @ApiPropertyOptional({ example: '18:00', description: 'Schedule start time (HH:mm)' })
  @IsOptional()
  @IsString()
  scheduleStart?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Schedule end time (HH:mm)' })
  @IsOptional()
  @IsString()
  scheduleEnd?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo', description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 100, description: 'Max conversations per day' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDailyConversations?: number;
}

export class CreateAgentDto {
  @ApiProperty({ example: 'Support Bot', description: 'Agent name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Handles first-line support', description: 'Agent description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'AI provider configuration' })
  @ValidateNested()
  @Type(() => AgentConfig)
  @IsObject()
  config: AgentConfig;

  @ApiProperty({ description: 'Trigger configuration' })
  @ValidateNested()
  @Type(() => AgentTriggers)
  @IsObject()
  triggers: AgentTriggers;
}
