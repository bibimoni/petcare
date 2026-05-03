import apiClient from "@/lib/api";

export interface StatsData {
  total_pets: {
    count: number;
    growth_percent: number;
  };
  today_bookings: {
    total: number;
    products: number;
    services: number;
  };
  today_profit: {
    profit: number;
    revenue: number;
    growth_percent: number;
  };
  storage_warnings: {
    expiring: number;
    low_stock: number;
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
  created_at: string;
  description: string;
  reference_id: number;
  reference_type: string;
}

export interface ActivityFeedData {
  activities: ActivityItem[];
}

export interface DashboardData {
  stats: StatsData;
  revenue: RevenueData;
  activities: ActivityFeedData;
}

export type ProfitPeriod = "year" | "this_week" | "last_week" | "last_month";

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const getDashboardStats = async (): Promise<StatsData | null> => {
  try {
    const response = await apiClient.get<StatsData>("/analytics/dashboard");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
};

export const getDashboardRevenue = async (
  period: ProfitPeriod = "this_week",
  year?: number,
): Promise<RevenueData> => {
  try {
    const now = new Date();
    let dateFrom = "";
    let dateTo = "";
    let granularity = "day";

    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

    switch (period) {
      case "this_week": {
        const startOfWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - distanceToMonday,
        );

        // Cộng thêm 1 ngày để bao trọn dữ liệu của ngày hiện tại
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        dateFrom = formatDate(startOfWeek);
        dateTo = formatDate(tomorrow);
        granularity = "day";
        break;
      }
      case "last_week": {
        const startOfLastWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - distanceToMonday - 7,
        );
        // Để lấy trọn Chủ Nhật tuần trước, ta set ngày kết thúc là Thứ 2 tuần này (00:00:00)
        const endOfLastWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - distanceToMonday,
        );
        dateFrom = formatDate(startOfLastWeek);
        dateTo = formatDate(endOfLastWeek);
        granularity = "day";
        break;
      }
      case "last_month": {
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        // Lấy ngày mùng 1 của tháng hiện tại để bao trọn ngày cuối cùng của tháng trước
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = formatDate(startOfLastMonth);
        dateTo = formatDate(endOfLastMonth);
        granularity = "week";
        break;
      }
      case "year": {
        const targetYear = year || now.getFullYear();
        const startOfYear = new Date(targetYear, 0, 1);
        // Lấy ngày 1 tháng 1 của năm tiếp theo để bao trọn ngày 31/12
        const endOfYear = new Date(targetYear + 1, 0, 1);

        dateFrom = formatDate(startOfYear);
        dateTo = formatDate(endOfYear);
        granularity = "month";
        break;
      }
    }

    const url = `/analytics/profit?date_from=${dateFrom}&date_to=${dateTo}&granularity=${granularity}`;

    const response =
      await apiClient.get<{ date: string; profit: number; revenue: number }[]>(
        url,
      );

    const data = response.data || [];

    if (granularity === "month") {
      const monthLabels = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ];
      const monthValues = new Array(12).fill(0);

      // Map dữ liệu thật từ BE vào đúng tháng
      data.forEach((item) => {
        const d = new Date(item.date);
        monthValues[d.getMonth()] = item.profit; // getMonth() trả về từ 0-11
      });

      const total = monthValues.reduce((sum, val) => sum + val, 0);
      return {
        days: monthLabels,
        values: monthValues,
        totalWeekly: total.toLocaleString("vi-VN") + "đ",
      };
    }

    // NẾU LÀ VIEW THEO NGÀY/TUẦN (Xử lý như cũ)
    if (data.length === 0) {
      return { days: ["Không có dữ liệu"], values: [0], totalWeekly: "0đ" };
    }

    const days = data.map((item) => {
      const d = new Date(item.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const values = data.map((item) => item.profit);
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
    const response = await apiClient.get<ActivityItem[]>(
      "/analytics/activities?limit=6",
    );
    return { activities: Array.isArray(response.data) ? response.data : [] };
  } catch (error) {
    console.error("Failed to fetch dashboard activities:", error);
    return { activities: [] };
  }
};

export const getDashboardData = async () => {
  try {
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
