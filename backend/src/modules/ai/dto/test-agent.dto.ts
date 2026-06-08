import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestAgentDto {
  @ApiProperty({ example: 'Hello, I need help with my order', description: 'Sample message to test the agent' })
  @IsString()
  message: string;
}
