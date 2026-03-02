import { type StatsData } from "../api/dashboard-api";
import { StatsCard } from "./stats-card";

interface StatsGridProps {
  data: StatsData;
}

export const StatsGrid = ({ data }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Pets Card */}
      <StatsCard
        label="Tổng số Pet"
        value={data.totalPets.toLocaleString()}
        icon="pets"
        iconBgColor="bg-orange-600/10 dark:bg-blue-900/30"
        iconColor="text-orange-600"
        trend={{
          direction: "up",
          value: `${data.servicesPercentage}%`,
          label: "so với tháng trước",
        }}
      />

      {/* Services Today Card */}
      <StatsCard
        label="Dịch vụ hôm nay"
        value={data.servicesToday}
        suffix="lịch"
        icon="content_cut"
        iconBgColor="bg-blue-200"
        iconColor="text-teal-800"
        trend={{
          direction: "up",
          value: `+${data.servicesToday - data.servicesYesterday}`,
          label: "so với hôm qua",
        }}
      />

      {/* Revenue Today Card */}
      <StatsCard
        label="Doanh thu ngày"
        value={data.revenueToday}
        icon="payments"
        iconBgColor="bg-red-400/20"
        iconColor="text-primary"
        trend={{
          direction: "up",
          value: `${data.revenueGrowth}%`,
          label: "tăng trưởng",
        }}
      />

      {/* Stock Warnings Card */}
      <StatsCard
        label="Cảnh báo kho"
        value={data.stockWarnings}
        suffix="món"
        icon="warning"
        iconBgColor="bg-red-400/40"
        iconColor="text-amber-600"
        trend={{
          direction: "down",
          value: "Cần nhập thêm",
          label: "",
        }}
      />
    </div>
  );
};
