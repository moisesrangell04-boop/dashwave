import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { QueryUserDto, UpdateUserDto, InviteUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users with pagination and filters' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: QueryUserDto,
  ) {
    return this.userService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.userService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (name, role, isActive)' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, tenantId, dto);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user' })
  invite(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.userService.invite(tenantId, workspaceId, dto);
  }
}
