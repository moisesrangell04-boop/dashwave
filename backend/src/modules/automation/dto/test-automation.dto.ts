import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestAutomationDto {
  @ApiProperty({
    type: 'object',
    example: {
      type: 'lead_created',
      payload: {
        leadId: 'uuid',
        contactId: 'uuid',
        lead: { title: 'Test Lead', value: 5000 },
      },
    },
  })
  @IsObject()
  mockEvent: {
    type: string;
    payload: Record<string, any>;
  };
}
