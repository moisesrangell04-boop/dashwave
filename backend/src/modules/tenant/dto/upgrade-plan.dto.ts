import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TenantPlan {
  free = 'free',
  starter = 'starter',
  professional = 'professional',
  enterprise = 'enterprise',
}

export class UpgradePlanDto {
  @ApiProperty({ enum: TenantPlan, example: 'professional', description: 'Target plan' })
  @IsEnum(TenantPlan)
  plan: TenantPlan;
}
