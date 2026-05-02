import apiClient from "@/lib/api";

export interface StatsData {
  total_pets: {
    count: number;
    growth_percent: number;
  };
  today_bookings: {
    products: number;
    services: number;
    total: number;
  };
  today_profit: {
    revenue: number;
    profit: number;
    growth_percent: number;
  };
  storage_warnings: {
    low_stock: number;
    expiring: number;
    out_of_stock: number;
  };
}

export interface RevenueData {
  days: string[];
  values: number[];
  totalWeekly: string;
}

export interface ActivityItem {
  type: string;
  title: string;
  description: string;
  reference_id: number;
  reference_type: string;
  created_at: string;
}

export interface ActivityFeedData {
  activities: ActivityItem[];
}

export interface DashboardData {
  stats: StatsData;
  revenue: RevenueData;
  activities: ActivityFeedData;
}

export const getDashboardStats = async (): Promise<StatsData | null> => {
  try {
    const response = await apiClient.get<StatsData>("/analytics/dashboard");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
};

export type ProfitPeriod = "week";

export const getDashboardRevenue = async (period: ProfitPeriod = "week"): Promise<RevenueData> => {
  try {
    const now = new Date();
    let dateFrom = "";
    let dateTo = now.toISOString().split("T")[0];
    let granularity = "day";

    if (period === "week") {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 6);
      dateFrom = lastWeek.toISOString().split("T")[0];
    }

    const temp = `/analytics/profit?date_from=${dateFrom}&date_to=${dateTo}&granularity=${granularity}`;

    const temp2 = `/analytics/profit?granularity=${granularity}`;

    const response = await apiClient.get<{ date: string, revenue: number, profit: number }[]>(
      temp2
    );

    const data = response.data || [];
    if (data.length === 0) {
      return { days: ["Không có dữ liệu"], values: [0], totalWeekly: "0" };
    }

    const days = data.map(item => {
      const d = new Date(item.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const values = data.map(item => item.profit);
    const total = values.reduce((sum, val) => sum + val, 0);
    const totalWeekly = total.toLocaleString("vi-VN") + "đ";

    return { days, values, totalWeekly };
  } catch (error) {
    console.error("Failed to fetch dashboard profit:", error);
    return { days: ["Lỗi"], values: [0], totalWeekly: "0đ" };
  }
};

export const getDashboardActivities = async (): Promise<ActivityFeedData> => {
  try {
    const response = await apiClient.get<ActivityItem[]>("/analytics/activities?limit=6");
    return { activities: Array.isArray(response.data) ? response.data : [] };
  } catch (error) {
    console.error("Failed to fetch dashboard activities:", error);
    return { activities: [] };
  }
};

export const getDashboardData = async () => {
  try {
    // Uncomment when API is ready:
    // const response = await axiosClient.get("/dashboard");
    // return response as DashboardData;

    const [stats, revenue, activities] = await Promise.all([
      getDashboardStats(),
      getDashboardRevenue(),
      getDashboardActivities(),
    ]);

    return {
      stats,
      revenue,
      activities,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  }
};
