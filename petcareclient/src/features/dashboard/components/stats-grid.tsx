import { PawPrint, Scissors, CircleDollarSign, AlertTriangle } from "lucide-react";
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
        icon={<PawPrint className="w-6 h-6" />}
        iconBgColor="bg-orange-600/10 dark:bg-blue-900/30"
        iconColor="orange-600"
        trend={{
          direction:
            (data.total_pets?.growth_percent ?? 0) >= 0 ? "up" : "down",
          value: `${(data.total_pets?.growth_percent ?? 0) >= 0 ? "+" : ""}${data.total_pets?.growth_percent ?? 0}%`,
          label: "so với tháng trước",
        }}
      />

      {/* Services Today Card */}
      <StatsCard
        label="Booking hôm nay"
        value={data.today_bookings?.total?.toLocaleString() || "0"}
        suffix="sản phẩm & dịch vụ"
        icon={<Scissors className="w-6 h-6" />}
        iconBgColor="bg-blue-200"
        iconColor="teal-800"
        trend={{
          direction: "up",
          value: `+${(data.today_bookings?.products || 0) + (data.today_bookings?.services || 0)}`,
          label: "so với hôm qua",
        }}
      />

      {/* Revenue Today Card */}
      <StatsCard
        label="Doanh thu ngày"
        value={data.today_profit?.revenue?.toLocaleString() || "0"}
        icon={<CircleDollarSign className="w-6 h-6" />}
        iconBgColor="bg-red-400/20"
        iconColor="primary"
        trend={{
          // Cập nhật hướng mũi tên dựa vào giá trị âm/dương
          direction:
            (data.today_profit?.growth_percent ?? 0) >= 0 ? "up" : "down",
          // Thêm dấu + nếu dương, số âm sẽ tự có dấu -
          value: `${(data.today_profit?.growth_percent ?? 0) >= 0 ? "+" : ""}${data.today_profit?.growth_percent ?? 0}%`,
          label: "so với hôm qua", // Đổi label cho hợp lý thay vì chữ "tăng trưởng" (tránh đọc thành "tăng trưởng âm")
        }}
      />

      {/* Stock Warnings Card */}
      <StatsCard
        label="Cảnh báo kho"
        value={
          (data.storage_warnings?.low_stock || 0) +
          (data.storage_warnings?.expiring || 0) +
          (data.storage_warnings?.out_of_stock || 0)
        }
        suffix="món"
        icon={<AlertTriangle className="w-6 h-6" />}
        iconBgColor="bg-red-400/40"
        iconColor="amber-600"
        trend={{
          direction: "down",
          value: "Cần nhập thêm",
          label: "",
        }}
      />
    </div>
  );
};
