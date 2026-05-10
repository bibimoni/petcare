import { useState, useEffect } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

import {
  type StatsData,
  type RevenueData,
  getDashboardStats,
  type ProfitPeriod,
  getDashboardRevenue,
  type ActivityFeedData,
  getDashboardActivities,
} from "./api/dashboard-api";
import { ActivityFeed } from "./components/activity-feed";
import { RevenueChart } from "./components/revenue-chart";
import { StatsGrid } from "./components/stats-grid";

export const DashboardPage = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [activities, setActivities] = useState<ActivityFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenuePeriod, setRevenuePeriod] = useState<ProfitPeriod>("this_week");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, activitiesData] = await Promise.all([
          getDashboardStats(),
          getDashboardActivities(),
        ]);

        setStats(statsData);
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

  useEffect(() => {
    const fetchRevenue = async () => {
      const revenueData = await getDashboardRevenue(
        revenuePeriod,
        selectedYear,
      );
      setRevenue(revenueData);
    };
    fetchRevenue();
  }, [revenuePeriod, selectedYear]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header */}
        <Header />

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
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="h-10 w-10 animate-spin text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
                  {revenue && (
                    <RevenueChart
                      titleText="Lợi nhuận"
                      noteText="Tổng thu"
                      data={revenue}
                      period={revenuePeriod}
                      onPeriodChange={setRevenuePeriod}
                      selectedYear={selectedYear}
                      onYearChange={setSelectedYear}
                    />
                  )}

                  {activities && <ActivityFeed data={activities} />}
                </div>
              </>
            )}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};
