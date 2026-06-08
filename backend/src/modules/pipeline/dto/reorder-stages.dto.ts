import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderStagesDto {
  @ApiProperty({
    example: ['stage-id-1', 'stage-id-2', 'stage-id-3'],
    description: 'Stage IDs in desired order',
  })
  @IsArray()
  @IsString({ each: true })
  stageIds: string[];
}
