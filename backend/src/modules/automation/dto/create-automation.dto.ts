import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsNumber,
  MinLength,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AutomationTriggerType {
  message_received = 'message_received',
  conversation_created = 'conversation_created',
  conversation_closed = 'conversation_closed',
  lead_moved = 'lead_moved',
  lead_created = 'lead_created',
  lead_lost = 'lead_lost',
  pipedrive_deal_updated = 'pipedrive.deal_updated',
  contact_tag_added = 'contact_tag_added',
  contact_created = 'contact_created',
  schedule = 'schedule',
  webhook = 'webhook',
  condition = 'condition',
}

export enum AutomationActionType {
  send_message = 'send_message',
  change_stage = 'change_stage',
  assign_user = 'assign_user',
  assign_agent = 'assign_agent',
  add_tag = 'add_tag',
  remove_tag = 'remove_tag',
  update_field = 'update_field',
  send_email = 'send_email',
  notify_user = 'notify_user',
  webhook = 'webhook',
  ai_agent = 'ai_agent',
  create_lead = 'create_lead',
  create_conversation = 'create_conversation',
  close_conversation = 'close_conversation',
}

export class ConditionDto {
  @ApiProperty({ example: 'lead.value' })
  @IsString()
  field: string;

  @ApiProperty({ example: 'greater_than', enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'] })
  @IsString()
  operator: string;

  @ApiProperty({ example: 1000 })
  value: any;
}

export class TriggerDto {
  @ApiProperty({ enum: AutomationTriggerType })
  @IsEnum(AutomationTriggerType)
  type: AutomationTriggerType;

  @ApiPropertyOptional({ type: [ConditionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions?: ConditionDto[];

  @ApiPropertyOptional({ example: '0 9 * * 1' })
  @IsOptional()
  @IsString()
  scheduleExpression?: string;

  @ApiPropertyOptional({ example: 'https://n8n.example.com/webhook/abc' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class ActionDto {
  @ApiProperty({ enum: AutomationActionType })
  @IsEnum(AutomationActionType)
  type: AutomationActionType;

  @ApiProperty({ type: 'object', example: { message: 'Hello {{contact.name}}', templateId: 'welcome' } })
  @IsObject()
  config: Record<string, any>;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;
}

export class CreateAutomationDto {
  @ApiProperty({ example: 'Send welcome message on new lead' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name: string;

  @ApiPropertyOptional({ example: 'Automatically sends a welcome message when a lead is created' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: TriggerDto })
  @ValidateNested()
  @Type(() => TriggerDto)
  trigger: TriggerDto;

  @ApiProperty({ type: [ActionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions: ActionDto[];

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}
