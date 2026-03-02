// import axiosClient from "@/lib/api";

export interface StatsData {
  totalPets: number;
  revenueToday: string;
  servicesToday: number;
  revenueGrowth: number;
  stockWarnings: number;
  servicesYesterday: number;
  servicesPercentage: number;
}

export interface RevenueData {
  days: string[];
  values: number[];
  totalWeekly: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  action: string;
  petName: string;
  status: "completed" | "cancelled" | "pending";
  type: "service" | "purchase" | "vaccine" | "cancel" | "grooming";
}

export interface ActivityFeedData {
  activities: ActivityItem[];
}

export interface DashboardData {
  stats: StatsData;
  revenue: RevenueData;
  activities: ActivityFeedData;
}

const mockStatsData: StatsData = {
  totalPets: 1240,
  servicesPercentage: 12,
  servicesToday: 12,
  servicesYesterday: 10,
  revenueToday: "5.4tr",
  revenueGrowth: 8.5,
  stockWarnings: 3,
};

const mockRevenueData: RevenueData = {
  days: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"],
  values: [4.5, 5.2, 3.8, 6.1, 7.2, 5.9, 4.8],
  totalWeekly: "38.500.000đ",
};

const mockActivitiesData: ActivityFeedData = {
  activities: [
    {
      id: "1",
      petName: "Cún Misa",
      action: "Dịch vụ: Tắm gội toàn thân",
      type: "service",
      time: "10:30",
      status: "completed",
    },
    {
      id: "2",
      petName: "Mèo Tom",
      action: "Mua: Pate Royal Canin x2",
      type: "purchase",
      time: "09:15",
      status: "completed",
    },
    {
      id: "3",
      petName: "Cún Bông",
      action: "Tiêm phòng dại",
      type: "vaccine",
      time: "08:45",
      status: "completed",
    },
    {
      id: "4",
      petName: "Mèo Mun",
      action: "Hủy lịch cắt móng",
      type: "cancel",
      time: "Hôm qua",
      status: "cancelled",
    },
    {
      id: "5",
      petName: "Golden Vàng",
      action: "Cắt tỉa lông - Gói VIP",
      type: "grooming",
      time: "Hôm qua",
      status: "completed",
    },
  ],
};

export const getDashboardStats = async (): Promise<StatsData> => {
  try {
    // Uncomment when API is ready:
    // const response = await axiosClient.get("/dashboard/stats");
    // return response as StatsData;

    // Using mock data for now
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStatsData), 500);
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return mockStatsData;
  }
};

export const getDashboardRevenue = async (): Promise<RevenueData> => {
  try {
    // Uncomment when API is ready:
    // const response = await axiosClient.get("/dashboard/revenue");
    // return response as RevenueData;

    // Using mock data for now
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockRevenueData), 500);
    });
  } catch (error) {
    console.error("Failed to fetch dashboard revenue:", error);
    return mockRevenueData;
  }
};

export const getDashboardActivities = async (): Promise<ActivityFeedData> => {
  try {
    // Uncomment when API is ready:
    // const response = await axiosClient.get("/dashboard/activities");
    // return response as ActivityFeedData;

    // Using mock data for now
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockActivitiesData), 500);
    });
  } catch (error) {
    console.error("Failed to fetch dashboard activities:", error);
    return mockActivitiesData;
  }
};

export const getDashboardData = async (): Promise<DashboardData> => {
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
    return {
      stats: mockStatsData,
      revenue: mockRevenueData,
      activities: mockActivitiesData,
    };
  }
};
