import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CurrentUser, RequirePermissions, isSuperAdmin } from 'src/common';
import { STORE_PERMISSIONS } from 'src/common/permissions/store.permissions';
import {
  ProfitQueryDto,
  OrderStatsQueryDto,
  ActivitiesQueryDto,
} from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller({ path: '/analytics', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private getScopeInfo(user: any): {
    storeId: number | null;
    isSuperAdmin: boolean;
  } {
    const admin = isSuperAdmin(user);
    return { storeId: admin ? null : user.store_id, isSuperAdmin: admin };
  }

  @Get('/dashboard')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Get dashboard analytics overview' })
  async getDashboard(@CurrentUser() user: any) {
    const { storeId, isSuperAdmin } = this.getScopeInfo(user);
    return this.analyticsService.getDashboard(storeId, isSuperAdmin);
  }

  @Get('/pets/stats')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Get pet statistics with growth' })
  async getPetStats(@CurrentUser() user: any) {
    const { storeId, isSuperAdmin } = this.getScopeInfo(user);
    return this.analyticsService.getPetStats(storeId, isSuperAdmin);
  }

  @Get('/orders/stats')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({
    summary: 'Get order statistics with revenue, profit, growth',
  })
  async getOrderStats(
    @CurrentUser() user: any,
    @Query() query: OrderStatsQueryDto,
  ) {
    const { storeId, isSuperAdmin } = this.getScopeInfo(user);
    return this.analyticsService.getOrderStats(storeId, isSuperAdmin, query);
  }

  @Get('/profit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Get profit time series for graphs' })
  async getProfitTimeSeries(
    @CurrentUser() user: any,
    @Query() query: ProfitQueryDto,
  ) {
    const { storeId, isSuperAdmin } = this.getScopeInfo(user);
    return this.analyticsService.getProfitTimeSeries(
      storeId,
      isSuperAdmin,
      query,
    );
  }

  @Get('/inventory/alerts')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Get low stock and expiring product alerts' })
  async getInventoryAlerts(@CurrentUser() user: any) {
    const { storeId, isSuperAdmin } = this.getScopeInfo(user);
    return this.analyticsService.getInventoryAlerts(storeId, isSuperAdmin);
  }

  @Get('/activities')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Get recent activity feed' })
  async getRecentActivities(
    @CurrentUser() user: any,
    @Query() query: ActivitiesQueryDto,
  ) {
    const { storeId, isSuperAdmin } = this.getScopeInfo(user);
    return this.analyticsService.getRecentActivities(
      storeId,
      isSuperAdmin,
      query.limit,
    );
  }
}
