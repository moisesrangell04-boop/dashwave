import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@acme.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: 'User password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Company / tenant name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName: string;

  @ApiPropertyOptional({ example: 'Main Workspace', description: 'Initial workspace name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  workspaceName?: string;
}
