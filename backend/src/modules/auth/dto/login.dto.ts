import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@acme.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: 'User password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'Two-factor authentication code' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
