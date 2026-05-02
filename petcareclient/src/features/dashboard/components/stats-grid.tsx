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
        value={data.total_pets?.count?.toLocaleString() || "0"}
        icon="pets"
        iconBgColor="bg-orange-600/10 dark:bg-blue-900/30"
        iconColor="text-orange-600"
        trend={{
          direction: data.total_pets?.growth_percent >= 0 ? "up" : "down",
          value: `${data.total_pets?.growth_percent >= 0 ? "+" : ""}${data.total_pets?.growth_percent}%`,
          label: "so với tháng trước",
        }}
      />

      {/* Services Today Card */}
      <StatsCard
        label="Dịch vụ hôm nay"
        value={data.today_bookings?.total?.toLocaleString() || "0"}
        suffix="lịch"
        icon="content_cut"
        iconBgColor="bg-blue-200"
        iconColor="text-teal-800"
        trend={{
          direction: "up",
          value: `+${data.today_bookings?.products || 0 + data.today_bookings?.services || 0}`,
          label: "so với hôm qua",
        }}
      />

      {/* Revenue Today Card */}
      <StatsCard
        label="Doanh thu ngày"
        value={data.today_profit?.revenue?.toLocaleString() || "0"}
        icon="payments"
        iconBgColor="bg-red-400/20"
        iconColor="text-primary"
        trend={{
          direction: "up",
          value: `${data.today_profit?.growth_percent}%`,
          label: "tăng trưởng",
        }}
      />

      {/* Stock Warnings Card */}
      <StatsCard
        label="Cảnh báo kho"
        value={(data.storage_warnings?.low_stock || 0) +
          (data.storage_warnings?.expiring || 0) +
          (data.storage_warnings?.out_of_stock || 0)
        }
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
