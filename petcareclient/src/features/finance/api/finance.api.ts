import { getOrders, type OrderListItemDto } from "@/features/pos/api";

export interface FinanceStats {
  grossProfit: number;
  totalRevenue: number;
  ordersGrowth: number;
  profitGrowth: number;
  revenueGrowth: number;
  completedOrders: number;
}

export interface RevenueStructure {
  products: {
    value: number;
    percentage: number;
  };
  services: {
    value: number;
    percentage: number;
  };
}

export interface ProfitDetailItem {
  id: string;
  date: string;
  cogs: number;
  profit: number;
  status: string;
  orderId: number;
  revenue: number;
  customerName: string;
  customerAvatar?: string;
}

export interface FinanceData {
  stats: FinanceStats;
  profitDetails: ProfitDetailItem[];
  revenueStructure: RevenueStructure;
}

/**
 * Calculates finance data from a list of orders
 */
export const calculateFinanceData = (
  orders: OrderListItemDto[],
  previousMonthOrders: OrderListItemDto[] = [],
): FinanceData => {
  let totalRevenue = 0;
  let completedOrders = 0;
  let totalCogs = 0;

  let productRevenue = 0;
  let serviceRevenue = 0;

  const profitDetails: ProfitDetailItem[] = orders.map((order) => {
    const revenue = Number(order.total_amount || 0);
    if (order.status === "COMPLETED" || order.status === "PAID") {
      totalRevenue += revenue;
      completedOrders += 1;
    }

    let orderCogs = 0;
    order.order_details.forEach((detail) => {
      // Logic for Revenue Structure
      const detailSubtotal = Number(detail.subtotal || 0);
      if (detail.item_type === "PRODUCT") {
        productRevenue += detailSubtotal;

        // Logic for COGS (Price of Goods Sold) - Only for Products
        // The user corrected: only products have cost price
        const costPrice =
          (detail as any).cost_price ||
          (detail as any).product?.cost_price ||
          0;
        orderCogs += Number(costPrice) * detail.quantity;
      } else if (detail.item_type === "SERVICE") {
        serviceRevenue += detailSubtotal;
        // Services have 0 COGS based on user's update
      }
    });

    if (order.status === "COMPLETED" || order.status === "PAID") {
      totalCogs += orderCogs;
    }

    return {
      id: `ORD-${order.order_id}`,
      orderId: order.order_id,
      date: order.created_at,
      customerName: order.customer?.full_name || "Khách lẻ",
      revenue: revenue,
      cogs: orderCogs,
      profit: revenue - orderCogs,
      status: order.status,
    };
  });

  const grossProfit = totalRevenue - totalCogs;

  // Growth calculations (Mocked for now or based on previous month if available)
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Simple aggregation for growth if previousMonthOrders is provided
  let prevRevenue = 0;
  let prevOrders = 0;
  let prevCogs = 0;

  previousMonthOrders.forEach((order) => {
    if (order.status === "COMPLETED" || order.status === "PAID") {
      prevRevenue += Number(order.total_amount || 0);
      prevOrders += 1;
      order.order_details.forEach((detail) => {
        if (detail.item_type === "PRODUCT") {
          const costPrice =
            (detail as any).cost_price ||
            (detail as any).product?.cost_price ||
            0;
          prevCogs += Number(costPrice) * detail.quantity;
        }
      });
    }
  });
  const prevProfit = prevRevenue - prevCogs;

  const totalRevenueStructure = productRevenue + serviceRevenue || 1;

  return {
    stats: {
      totalRevenue,
      completedOrders,
      grossProfit,
      revenueGrowth: calculateGrowth(totalRevenue, prevRevenue),
      ordersGrowth: calculateGrowth(completedOrders, prevOrders),
      profitGrowth: calculateGrowth(grossProfit, prevProfit),
    },
    revenueStructure: {
      products: {
        value: productRevenue,
        percentage: (productRevenue / totalRevenueStructure) * 100,
      },
      services: {
        value: serviceRevenue,
        percentage: (serviceRevenue / totalRevenueStructure) * 100,
      },
    },
    profitDetails,
  };
};

export const fetchFinanceData = async (dateFrom?: string, dateTo?: string) => {
  // Fetch orders for the current range
  const currentOrdersResponse = await getOrders(1, 1000, {
    date_from: dateFrom,
    date_to: dateTo,
    status: "PAID", // Default to paid/completed for financial reports
  });

  // To calculate growth, we ideally need previous period data.
  // For simplicity in this real-time UI, we'll focus on the current period.
  // If growth is strictly required, we'd need another API call for the previous period.

  return calculateFinanceData(currentOrdersResponse.data);
};
