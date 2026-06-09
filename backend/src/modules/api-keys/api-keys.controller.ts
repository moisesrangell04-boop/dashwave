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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto, QueryApiKeyDto } from './dto/api-key.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() dto: CreateApiKeyDto, @CurrentUser() user: any) {
    return this.apiKeysService.create(dto, user.tenantId);
  }

  @Get()
  findAll(@Query() query: QueryApiKeyDto, @CurrentUser() user: any) {
    return this.apiKeysService.findAll(query, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.apiKeysService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApiKeyDto,
    @CurrentUser() user: any,
  ) {
    return this.apiKeysService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.apiKeysService.remove(id, user.tenantId);
  }
}
