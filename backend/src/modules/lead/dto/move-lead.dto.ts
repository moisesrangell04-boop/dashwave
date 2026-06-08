import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveLeadDto {
  @ApiProperty({ description: 'Target stage ID' })
  @IsString()
  stageId: string;
}
