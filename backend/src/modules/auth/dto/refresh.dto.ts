import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT refresh token' })
  @IsString()
  refreshToken: string;
}
