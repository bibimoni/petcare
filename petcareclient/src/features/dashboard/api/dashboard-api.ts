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

    // --- LOGIC MAP DỮ LIỆU VÀO KHUNG CHUẨN ---
    let days: string[] = [];
    let values: number[] = [];

    // 1. Nếu chọn Năm (12 Tháng)
    if (granularity === "month") {
      days = [
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
      values = new Array(12).fill(0);

      data.forEach((item) => {
        const d = new Date(item.date);
        values[d.getMonth()] = item.profit;
      });
    }
    // 2. Nếu chọn Tháng (Tuần 1, Tuần 2, Tuần 3, Tuần 4...)
    else if (granularity === "week") {
      // Hàm helper tính xem một ngày rơi vào tuần thứ mấy trong tháng (1, 2, 3...)
      // Mở rộng nhận cả Date object và string
      const getWeekOfMonth = (dateInput: Date | string) => {
        const d = new Date(dateInput);
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
        return Math.ceil(
          (d.getDate() + (firstDay === 0 ? 6 : firstDay - 1)) / 7,
        );
      };

      const targetYear = now.getFullYear();
      const targetMonth = now.getMonth() - 1; // Tháng trước

      // Đếm số tuần của tháng trước bằng cách lấy ngày cuối cùng
      const lastDayOfLastMonth = new Date(targetYear, targetMonth + 1, 0);
      const totalWeeks = getWeekOfMonth(lastDayOfLastMonth);

      // Khởi tạo sườn lưu ngày bắt đầu và kết thúc của từng tuần
      const weekRanges = Array.from({ length: totalWeeks }, () => ({
        start: "",
        end: "",
      }));

      // Duyệt qua tất cả các ngày trong tháng để tìm start/end của mỗi tuần
      for (let day = 1; day <= lastDayOfLastMonth.getDate(); day++) {
        const d = new Date(targetYear, targetMonth, day);
        const weekIndex = getWeekOfMonth(d) - 1;
        const dateString = `${d.getDate()}/${d.getMonth() + 1}`;

        // Nếu tuần này chưa có ngày bắt đầu thì gán ngày hiện tại vào
        if (!weekRanges[weekIndex].start) {
          weekRanges[weekIndex].start = dateString;
        }
        // Liên tục đè ngày hiện tại vào làm ngày kết thúc (ngày cuối cùng lặp qua sẽ là end)
        weekRanges[weekIndex].end = dateString;
      }

      // Map mảng weekRanges thành label hiển thị: "Tuần 1 (1/4 - 5/4)"
      days = weekRanges.map((w, i) => `Tuần ${i + 1} (${w.start} - ${w.end})`);
      values = new Array(totalWeeks).fill(0);

      data.forEach((item) => {
        const weekIndex = getWeekOfMonth(item.date) - 1;
        // Kiểm tra an toàn để đảm bảo index không bị lọt ra ngoài mảng
        if (weekIndex >= 0 && weekIndex < totalWeeks) {
          values[weekIndex] = item.profit;
        }
      });
    }
    // 3. Nếu chọn Tuần này / Tuần trước (7 Ngày từ Thứ 2 -> CN)
    else {
      // Xác định ngày bắt đầu vòng lặp tuỳ theo period
      let currentIterDate = new Date();
      if (period === "this_week") {
        currentIterDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - distanceToMonday,
        );
      } else if (period === "last_week") {
        currentIterDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - distanceToMonday - 7,
        );
      }

      // Tạo mảng 7 ngày (T2, T3, ... CN)
      days = [];
      values = new Array(7).fill(0);
      const dayNames = [
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
        "Chủ Nhật",
      ];

      // Map nhanh data từ BE (key là YYYY-MM-DD, value là profit) để tìm cho lẹ
      const dataMap = new Map(
        data.map((item) => [item.date.split("T")[0], item.profit]),
      );

      for (let i = 0; i < 7; i++) {
        const dateStr = formatDate(currentIterDate);

        // Thêm nhãn (VD: "T2 (15/4)")
        days.push(
          `${dayNames[i]} (${currentIterDate.getDate()}/${currentIterDate.getMonth() + 1})`,
        );

        // Đắp data nếu có, không có thì giữ nguyên số 0
        if (dataMap.has(dateStr)) {
          values[i] = dataMap.get(dateStr) as number;
        }

        // Tăng thêm 1 ngày
        currentIterDate.setDate(currentIterDate.getDate() + 1);
      }
    }

    // Tính tổng doanh thu tuần/tháng/năm
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
