import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@acme.com', description: 'Registered email address' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token received via email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'N3wP@ssw0rd!', description: 'New password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
