import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook configuration name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Webhook destination URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Events to subscribe to', type: [String] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({ description: 'Secret key for webhook signature validation' })
  @IsOptional()
  @IsString()
  secret?: string;
}
