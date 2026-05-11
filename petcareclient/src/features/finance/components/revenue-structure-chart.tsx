import { type RevenueStructure } from "../api/finance.api";

interface RevenueStructureChartProps {
  data: RevenueStructure;
}

export const RevenueStructureChart = ({ data }: RevenueStructureChartProps) => {
  const { products, services } = data;

  // Total for the chart (value based or percentage based)
  const radius = 70;
  const strokeWidth = 35;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const productOffset =
    circumference - (products.percentage / 100) * circumference;
  const serviceOffset =
    circumference - (services.percentage / 100) * circumference;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
        Cơ cấu nguồn thu
      </h3>

      <div className="flex flex-col items-center">
        <div className="relative mb-8">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90 overflow-visible"
          >
            {/* Background Circle */}
            <circle
              stroke="#f3f4f6"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="dark:stroke-gray-700"
            />

            {/* Products Slice (Orange) */}
            <circle
              stroke="#fca5a5"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset: productOffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeLinecap="butt"
              className="transition-all duration-1000 ease-out"
            />

            {/* Services Slice (Green/Teal) - Offset by Products */}
            <circle
              stroke="#99f6e4"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{
                strokeDashoffset: serviceOffset,
                transform: `rotate(${(products.percentage / 100) * 360}deg)`,
                transformOrigin: `${radius}px ${radius}px`,
              }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeLinecap="butt"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Tổng
            </p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              100%
            </p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                Sản phẩm
              </span>
            </div>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              {formatCurrency(products.value)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-200" />
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                Dịch vụ
              </span>
            </div>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              {formatCurrency(services.value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
