import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Tenant')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant information' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getCurrent(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantService.getTenant(tenantId);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Update current tenant settings' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  updateCurrent(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.updateTenant(tenantId, dto);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current tenant usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getUsage(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantService.getUsage(tenantId);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade tenant plan' })
  @ApiResponse({ status: 200, description: 'Plan upgraded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or downgrade not allowed' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  upgradePlan(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpgradePlanDto,
  ) {
    return this.tenantService.upgradePlan(tenantId, dto.plan);
  }
}
