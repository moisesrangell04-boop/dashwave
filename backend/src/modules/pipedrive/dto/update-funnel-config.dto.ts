import { IsArray, IsString, IsNumber, Min, Max, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FunnelUserConfig {
  @ApiProperty({ example: 'Gabi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(1)
  @Max(100)
  weight: number;
}

export class UpdateFunnelConfigDto {
  @ApiProperty({ type: [FunnelUserConfig], example: [{ name: 'Gabi', weight: 70 }, { name: 'Dani', weight: 30 }] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FunnelUserConfig)
  users: FunnelUserConfig[];
}
