import { useState, useEffect } from "react";

import { Sidebar } from "@/components/Sidebar";
import { sidebarUser } from "@/lib/user";

import {
  type StatsData,
  type RevenueData,
  getDashboardStats,
  getDashboardRevenue,
  type ActivityFeedData,
  getDashboardActivities,
} from "./api/dashboard-api";
import { ActivityFeed } from "./components/activity-feed";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { RevenueChart } from "./components/revenue-chart";
import { StatsGrid } from "./components/stats-grid";

export const DashboardPage = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [activities, setActivities] = useState<ActivityFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, revenueData, activitiesData] = await Promise.all([
          getDashboardStats(),
          getDashboardRevenue(),
          getDashboardActivities(),
        ]);

        setStats(statsData);
        setRevenue(revenueData);
        setActivities(activitiesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // TODO: Implement search functionality
  };

  const handleQuickAdd = () => {
    console.log("Quick add clicked");
    // TODO: Implement quick add modal
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar userInfo={sidebarUser} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header */}
        <Header onSearch={handleSearch} onQuickAdd={handleQuickAdd} />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl flex flex-col gap-8">
            {/* Page Title Section */}
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-charcoal dark:text-white tracking-tight">
                  Tổng quan cửa hàng
                </h2>
                <p className="text-gray-500 mt-1 dark:text-gray-400">
                  Chào buổi sáng, chúc bạn một ngày làm việc hiệu quả!
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-lg bg-white dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin">
                    <span className="material-symbols-outlined text-4xl text-primary">
                      loading
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Đang tải dữ liệu...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-900/50">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                {stats && <StatsGrid data={stats} />}

                {/* Charts and Activity Feed Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Revenue Chart - Takes up 2 columns */}
                  {revenue && <RevenueChart data={revenue} />}

                  {/* Activity Feed - Takes up 1 column */}
                  {activities && <ActivityFeed data={activities} />}
                </div>
              </>
            )}

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
};
