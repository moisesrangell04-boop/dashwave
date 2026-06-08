import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TriggerDto, ActionDto } from './create-automation.dto';

export class UpdateAutomationDto {
  @ApiPropertyOptional({ example: 'Send welcome message on new lead' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional({ example: 'Automatically sends a welcome message when a lead is created' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: TriggerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerDto)
  trigger?: TriggerDto;

  @ApiPropertyOptional({ type: [ActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions?: ActionDto[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}
