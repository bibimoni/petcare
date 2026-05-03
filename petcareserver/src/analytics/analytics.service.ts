import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../pets/entities/pet.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Product } from '../categories/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { CategoryType, OrderStatus } from '../common/enum';
import {
  appNow,
  appDateFromParts,
  appDateParts,
  appStartOfDay,
  parseDateInAppTimezone,
  appPeriodKey,
  tzInterval,
} from '../common/utils/timezone';
import {
  ProfitGranularity,
  ProfitQueryDto,
  OrderStatsQueryDto,
} from './dto/analytics.dto';

export interface GrowthMetric {
  count: number;
  growth_percent: number;
}

export interface TodayBookings {
  products: number;
  services: number;
  total: number;
}

export interface TodayProfit {
  revenue: number;
  profit: number;
  growth_percent: number;
}

export interface StorageWarnings {
  low_stock: number;
  expiring: number;
  out_of_stock: number;
}

export interface DashboardResponse {
  total_pets: GrowthMetric;
  today_bookings: TodayBookings;
  today_profit: TodayProfit;
  storage_warnings: StorageWarnings;
  recent_activities: ActivityItem[];
}

export interface ActivityItem {
  type:
    | 'ORDER_CREATED'
    | 'ORDER_CANCELLED'
    | 'ORDER_PAID'
    | 'PET_ADDED'
    | 'CUSTOMER_ADDED'
    | 'LOW_STOCK'
    | 'PRODUCT_EXPIRED';
  title: string;
  description: string;
  reference_id: number;
  reference_type: 'order' | 'pet' | 'customer' | 'product';
  created_at: Date;
}

export interface ProfitDataPoint {
  date: string;
  revenue: number;
  profit: number;
}

export interface OrderStatsResponse {
  revenue: number;
  profit: number;
  order_count: number;
  growth_percent: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getDashboard(
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<DashboardResponse> {
    const [
      totalPets,
      todayBookings,
      todayProfit,
      storageWarnings,
      recentActivities,
    ] = await Promise.all([
      this.getPetStats(storeId, isSuperAdmin),
      this.getTodayBookings(storeId, isSuperAdmin),
      this.getTodayProfit(storeId, isSuperAdmin),
      this.getStorageWarnings(storeId, isSuperAdmin),
      this.getRecentActivities(storeId, isSuperAdmin, 5),
    ]);

    return {
      total_pets: totalPets,
      today_bookings: todayBookings,
      today_profit: todayProfit,
      storage_warnings: storageWarnings,
      recent_activities: recentActivities,
    };
  }

  async getPetStats(
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<GrowthMetric> {
    const now = appNow();
    const { year, month } = appDateParts(now);
    const startOfThisMonth = appDateFromParts(year, month, 1);
    const startOfLastMonth = appDateFromParts(year, month - 1, 1);
    const endOfLastMonth = appDateFromParts(year, month, 0);

    const buildCountQuery = (from: Date, to: Date) => {
      const q = this.petRepository
        .createQueryBuilder('pet')
        .where('pet.created_at BETWEEN :from AND :to', { from, to });
      if (!isSuperAdmin && storeId) {
        q.andWhere('pet.store_id = :storeId', { storeId });
      }
      return q.getCount();
    };

    const [currentCount, previousCount, total] = await Promise.all([
      buildCountQuery(startOfThisMonth, now),
      buildCountQuery(startOfLastMonth, endOfLastMonth),
      (async () => {
        const q = this.petRepository.createQueryBuilder('pet');
        if (!isSuperAdmin && storeId) {
          q.where('pet.store_id = :storeId', { storeId });
        }
        return q.getCount();
      })(),
    ]);

    const growth_percent =
      previousCount === 0
        ? 0
        : ((currentCount - previousCount) / previousCount) * 100;

    return {
      count: total,
      growth_percent: Math.round(growth_percent * 100) / 100,
    };
  }

  async getTodayBookings(
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<TodayBookings> {
    const now = appNow();
    const startOfDay = appStartOfDay(now);

    const buildBookingQuery = (itemType: CategoryType) => {
      const q = this.orderDetailRepository
        .createQueryBuilder('od')
        .innerJoin(
          'od.order',
          'order',
          'order.status = :status AND order.created_at >= :startOfDay',
          { status: OrderStatus.PAID, startOfDay },
        )
        .where('od.item_type = :type', { type: itemType });
      if (!isSuperAdmin && storeId) {
        q.andWhere('order.store_id = :storeId', { storeId });
      }
      return q.getCount();
    };

    const [products, services] = await Promise.all([
      buildBookingQuery(CategoryType.PRODUCT),
      buildBookingQuery(CategoryType.SERVICE),
    ]);

    return { products, services, total: products + services };
  }

  async getTodayProfit(
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<TodayProfit> {
    const now = appNow();
    const { year, month, day } = appDateParts(now);
    const startOfDay = appDateFromParts(year, month, day);

    const todayRevenue = await this.calculateRevenue(
      startOfDay,
      now,
      storeId,
      isSuperAdmin,
    );
    const todayProfit = await this.calculateProfit(
      startOfDay,
      now,
      storeId,
      isSuperAdmin,
    );

    const yesterdayStart = appDateFromParts(year, month, day - 1);
    const yesterdayEnd = appDateFromParts(year, month, day);
    const yesterdayProfit = await this.calculateProfit(
      yesterdayStart,
      yesterdayEnd,
      storeId,
      isSuperAdmin,
    );

    const growth_percent =
      yesterdayProfit === 0
        ? 0
        : ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100;

    return {
      revenue: todayRevenue,
      profit: todayProfit,
      growth_percent: Math.round(growth_percent * 100) / 100,
    };
  }

  async getStorageWarnings(
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<StorageWarnings> {
    const now = appNow();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);

    const buildWarningQuery = (
      condition: string,
      params?: Record<string, any>,
    ) => {
      const q = this.productRepository
        .createQueryBuilder('product')
        .where(condition, params);
      if (!isSuperAdmin && storeId) {
        q.andWhere('product.store_id = :storeId', { storeId });
      }
      return q.getCount();
    };

    const [low_stock, expiring, out_of_stock] = await Promise.all([
      buildWarningQuery(
        'product.stock_quantity < 5 AND product.stock_quantity > 0',
      ),
      buildWarningQuery('product.expiry_date BETWEEN :now AND :soon', {
        now,
        soon,
      }),
      buildWarningQuery('product.stock_quantity = 0'),
    ]);

    return { low_stock, expiring, out_of_stock };
  }

  async getRecentActivities(
    storeId: number | null,
    isSuperAdmin: boolean,
    limit: number = 20,
  ): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    const orderQuery = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('order.created_at', 'DESC')
      .limit(limit);

    if (!isSuperAdmin && storeId) {
      orderQuery.where('order.store_id = :storeId', { storeId });
    }

    const recentOrders = await orderQuery.getMany();
    for (const order of recentOrders) {
      let type: ActivityItem['type'];
      let title: string;
      if (order.status === OrderStatus.CANCELLED) {
        type = 'ORDER_CANCELLED';
        title = `Order #${order.order_id} cancelled`;
      } else if (order.status === OrderStatus.PAID) {
        type = 'ORDER_PAID';
        title = `Order #${order.order_id} paid`;
      } else {
        type = 'ORDER_CREATED';
        title = `Order #${order.order_id} created`;
      }
      activities.push({
        type,
        title,
        description: `Amount: ${Number(order.total_amount).toLocaleString()}`,
        reference_id: order.order_id,
        reference_type: 'order',
        created_at: order.created_at,
      });
    }

    const petQuery = this.petRepository
      .createQueryBuilder('pet')
      .orderBy('pet.created_at', 'DESC')
      .limit(limit);

    if (!isSuperAdmin && storeId) {
      petQuery.where('pet.store_id = :storeId', { storeId });
    }

    const recentPets = await petQuery.getMany();
    for (const pet of recentPets) {
      activities.push({
        type: 'PET_ADDED',
        title: `Pet "${pet.name}" added`,
        description: `Breed: ${pet.breed || 'Unknown'}`,
        reference_id: pet.pet_id,
        reference_type: 'pet',
        created_at: pet.created_at,
      });
    }

    const customerQuery = this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.created_at', 'DESC')
      .limit(limit);

    if (!isSuperAdmin && storeId) {
      customerQuery.where('customer.store_id = :storeId', { storeId });
    }

    const recentCustomers = await customerQuery.getMany();
    for (const customer of recentCustomers) {
      activities.push({
        type: 'CUSTOMER_ADDED',
        title: `Customer "${customer.full_name}" added`,
        description: `Phone: ${customer.phone}`,
        reference_id: customer.customer_id,
        reference_type: 'customer',
        created_at: customer.created_at,
      });
    }

    const notifQuery = this.notificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.created_at', 'DESC')
      .limit(limit);

    if (!isSuperAdmin && storeId) {
      notifQuery.where('notification.store_id = :storeId', { storeId });
    }

    const recentNotifications = await notifQuery.getMany();
    for (const notif of recentNotifications) {
      let type: ActivityItem['type'] = 'LOW_STOCK';
      if (
        String(notif.type) === 'EXPIRED' ||
        String(notif.type) === 'EXPIRY_WARNING'
      ) {
        type = 'PRODUCT_EXPIRED';
      }
      activities.push({
        type,
        title: notif.title,
        description: notif.message,
        reference_id: notif.product_id || notif.notification_id,
        reference_type: 'product',
        created_at: notif.created_at,
      });
    }

    activities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return activities.slice(0, limit);
  }

  async getOrderStats(
    storeId: number | null,
    isSuperAdmin: boolean,
    query: OrderStatsQueryDto,
  ): Promise<OrderStatsResponse> {
    const dateFrom = query.date_from
      ? parseDateInAppTimezone(query.date_from)
      : (() => { const { year, month } = appDateParts(); return appDateFromParts(year, month, 1); })();
    const dateTo = query.date_to
      ? parseDateInAppTimezone(query.date_to)
      : appNow();

    const revenue = await this.calculateRevenue(
      dateFrom,
      dateTo,
      storeId,
      isSuperAdmin,
    );
    const profit = await this.calculateProfit(
      dateFrom,
      dateTo,
      storeId,
      isSuperAdmin,
    );

    const orderCountQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.created_at BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });

    if (!isSuperAdmin && storeId) {
      orderCountQuery.andWhere('order.store_id = :storeId', { storeId });
    }

    const order_count = await orderCountQuery.getCount();

    const rangeMs = dateTo.getTime() - dateFrom.getTime();
    const prevDateFrom = new Date(dateFrom.getTime() - rangeMs);
    const prevProfit = await this.calculateProfit(
      prevDateFrom,
      dateFrom,
      storeId,
      isSuperAdmin,
    );
    const growth_percent =
      prevProfit === 0 ? 0 : ((profit - prevProfit) / prevProfit) * 100;

    return {
      revenue,
      profit,
      order_count,
      growth_percent: Math.round(growth_percent * 100) / 100,
    };
  }

  async getProfitTimeSeries(
    storeId: number | null,
    isSuperAdmin: boolean,
    query: ProfitQueryDto,
  ): Promise<ProfitDataPoint[]> {
    const dateFrom = query.date_from
      ? parseDateInAppTimezone(query.date_from)
      : (() => { const { year, month } = appDateParts(); return appDateFromParts(year, month, 1); })();
    const dateTo = query.date_to
      ? parseDateInAppTimezone(query.date_to)
      : appNow();
    const granularity = query.granularity || ProfitGranularity.DAY;

    const ALLOWED_TRUNC_FNS = ['day', 'week', 'month'] as const;
    let truncFn: string;
    if (granularity === ProfitGranularity.DAY) {
      truncFn = 'day';
    } else if (granularity === ProfitGranularity.WEEK) {
      truncFn = 'week';
    } else {
      truncFn = 'month';
    }

    if (!ALLOWED_TRUNC_FNS.includes(truncFn as any)) {
      throw new Error('Invalid granularity');
    }

    const revenueQuery = this.orderRepository
      .createQueryBuilder('order')
      .select(`DATE_TRUNC('${truncFn}', order.created_at + INTERVAL '${tzInterval()}')`, 'period')
      .addSelect('COALESCE(SUM(order.total_amount), 0)', 'revenue')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.created_at BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .groupBy(`DATE_TRUNC('${truncFn}', order.created_at + INTERVAL '${tzInterval()}')`)
      .orderBy('period', 'ASC');

    if (!isSuperAdmin && storeId) {
      revenueQuery.andWhere('order.store_id = :storeId', { storeId });
    }

    const profitQuery = this.orderDetailRepository
      .createQueryBuilder('od')
      .innerJoin(
        'od.order',
        'order',
        'order.status = :status AND order.created_at BETWEEN :dateFrom AND :dateTo',
        { status: OrderStatus.PAID, dateFrom, dateTo },
      )
      .select(`DATE_TRUNC('${truncFn}', order.created_at + INTERVAL '${tzInterval()}')`, 'period')
      .addSelect('od.item_type', 'item_type')
      .addSelect('SUM(od.subtotal)', 'subtotal_sum')
      .addSelect('SUM(od.original_cost)', 'original_cost_sum')
      .groupBy(`DATE_TRUNC('${truncFn}', order.created_at + INTERVAL '${tzInterval()}')`)
      .addGroupBy('od.item_type')
      .orderBy('period', 'ASC');

    if (!isSuperAdmin && storeId) {
      profitQuery.andWhere('order.store_id = :storeId', { storeId });
    }

    const [revenueRows, profitRows] = await Promise.all([
      revenueQuery.getRawMany(),
      profitQuery.getRawMany(),
    ]);

    const revenueByPeriod = new Map<string, number>();
    for (const row of revenueRows) {
      const key = appPeriodKey(row.period);
      revenueByPeriod.set(key, Number(row.revenue) || 0);
    }

    const profitByPeriod = new Map<string, number>();
    for (const row of profitRows) {
      const key = appPeriodKey(row.period);
      const subtotal = Number(row.subtotal_sum) || 0;
      const originalCost = Number(row.original_cost_sum) || 0;
      const itemProfit =
        String(row.item_type) === String(CategoryType.PRODUCT)
          ? subtotal - originalCost
          : subtotal;
      profitByPeriod.set(key, (profitByPeriod.get(key) || 0) + itemProfit);
    }

    const allPeriods = new Set([
      ...revenueByPeriod.keys(),
      ...profitByPeriod.keys(),
    ]);

    const intervals = this.generateIntervals(dateFrom, dateTo, granularity);
    const intervalMap = new Map<string, string>();
    for (const interval of intervals) {
      const key = appPeriodKey(interval.start);
      intervalMap.set(key, interval.label);
    }

    const results: ProfitDataPoint[] = [];
    for (const periodKey of Array.from(allPeriods).sort()) {
      const lookupKey = appPeriodKey(periodKey);
      const label = intervalMap.get(lookupKey) || periodKey.split('T')[0];
      results.push({
        date: label,
        revenue: Math.round((revenueByPeriod.get(periodKey) || 0) * 100) / 100,
        profit: Math.round((profitByPeriod.get(periodKey) || 0) * 100) / 100,
      });
    }

    return results;
  }

  async getInventoryAlerts(
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<Product[]> {
    const now = appNow();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);

    const query = this.productRepository
      .createQueryBuilder('product')
      .where(
        '(product.stock_quantity = 0 OR product.stock_quantity < 5 OR product.expiry_date BETWEEN :now AND :soon)',
        { now, soon },
      );

    if (!isSuperAdmin && storeId) {
      query.andWhere('product.store_id = :storeId', { storeId });
    }

    return query.getMany();
  }

  private async calculateRevenue(
    dateFrom: Date,
    dateTo: Date,
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<number> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'total')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.created_at BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });

    if (!isSuperAdmin && storeId) {
      query.andWhere('order.store_id = :storeId', { storeId });
    }

    const result: { total: string } | undefined = await query.getRawOne();
    return Number(result?.total || 0) || 0;
  }

  private async calculateProfit(
    dateFrom: Date,
    dateTo: Date,
    storeId: number | null,
    isSuperAdmin: boolean,
  ): Promise<number> {
    const query = this.orderDetailRepository
      .createQueryBuilder('od')
      .innerJoin(
        'od.order',
        'order',
        'order.status = :status AND order.created_at BETWEEN :dateFrom AND :dateTo',
        { status: OrderStatus.PAID, dateFrom, dateTo },
      )
      .select('od.item_type', 'item_type')
      .addSelect('od.subtotal', 'subtotal')
      .addSelect('od.original_cost', 'original_cost');

    if (!isSuperAdmin && storeId) {
      query.andWhere('order.store_id = :storeId', { storeId });
    }

    const rows: {
      item_type: string;
      subtotal: string;
      original_cost: string;
    }[] = await query.getRawMany();

    let profit = 0;
    for (const row of rows) {
      const subtotal = Number(row.subtotal) || 0;
      const originalCost = Number(row.original_cost) || 0;
      if (String(row.item_type) === String(CategoryType.PRODUCT)) {
        profit += subtotal - originalCost;
      } else {
        profit += subtotal;
      }
    }

    return Math.round(profit * 100) / 100;
  }

  private generateIntervals(
    start: Date,
    end: Date,
    granularity: ProfitGranularity,
  ): { start: Date; end: Date; label: string }[] {
    const intervals: { start: Date; end: Date; label: string }[] = [];
    let current = new Date(start);

    while (current < end) {
      let next: Date;
      let label: string;
      const { year, month, day } = appDateParts(current);

      if (granularity === ProfitGranularity.DAY) {
        next = appDateFromParts(year, month, day + 1);
        label = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else if (granularity === ProfitGranularity.WEEK) {
        next = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
        label = `W${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        next = appDateFromParts(year, month + 1, 1);
        label = `${year}-${String(month + 1).padStart(2, '0')}`;
      }

      if (next > end) next = new Date(end);
      intervals.push({ start: new Date(current), end: new Date(next), label });
      current = next;
    }

    return intervals;
  }
}
