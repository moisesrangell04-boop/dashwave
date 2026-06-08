import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactService.create(tenantId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List contacts with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query() query: QueryContactDto,
  ) {
    return this.contactService.findAll(tenantId, workspaceId, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search contacts by name or phone' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (name or phone)' })
  search(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('q') q: string,
  ) {
    return this.contactService.search(tenantId, workspaceId, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact details with conversation count' })
  @ApiResponse({ status: 200, description: 'Contact retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contactService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contactService.delete(id, tenantId);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tags to a contact' })
  @ApiResponse({ status: 200, description: 'Tags added successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  addTags(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return this.contactService.addTags(id, tenantId, tags);
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove a tag from a contact' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  removeTag(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('tag') tag: string,
  ) {
    return this.contactService.removeTag(id, tenantId, tag);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block a contact' })
  @ApiResponse({ status: 200, description: 'Contact blocked successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  block(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contactService.block(id, tenantId);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblock a contact' })
  @ApiResponse({ status: 200, description: 'Contact unblocked successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  unblock(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contactService.unblock(id, tenantId);
  }
}
