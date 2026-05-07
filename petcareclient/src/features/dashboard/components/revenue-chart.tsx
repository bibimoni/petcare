import { useState } from "react";

import { type RevenueData, type ProfitPeriod } from "../api/dashboard-api";

interface RevenueChartProps {
  noteText: string;
  titleText: string;
  data: RevenueData;
  period: ProfitPeriod;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onPeriodChange: (period: ProfitPeriod) => void;
}

export const RevenueChart = ({
  data,
  period,
  titleText,
  noteText,
  onPeriodChange,
  selectedYear,
  onYearChange,
}: RevenueChartProps) => {
  // State để theo dõi index của điểm đang được hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate chart path based on values
  const maxValue = Math.max(...data.values);
  // Tránh chia cho 0 nếu tất cả data đều là 0
  const safeMaxValue = maxValue === 0 ? 1 : maxValue;

  const chartHeight = 280;
  const chartWidth = 800;
  const padding = 20;

  // Generate SVG path for the line chart
  const points = data.values.map((value, index) => {
    // Tránh lỗi chia cho 0 nếu data chỉ có 1 phần tử
    const x =
      data.values.length > 1
        ? (index / (data.values.length - 1)) * (chartWidth - padding * 2) +
        padding
        : chartWidth / 2; // Canh giữa đồ thị nếu chỉ có 1 điểm

    const y =
      chartHeight -
      (value / safeMaxValue) * (chartHeight - padding * 2) -
      padding;
    return { x, y, value };
  });

  // Create line path
  const linePath =
    points.length > 0
      ? points
        .map(
          (point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`,
        )
        .join(" ")
      : "";

  // Create fill area path
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${chartHeight} L${points[0].x},${chartHeight} Z`
      : "";

  // Find the highest point for default tooltip
  const highestPoint =
    points.length > 0
      ? points.reduce((prev, current) =>
        prev.value > current.value ? prev : current,
      )
      : null;

  // Điểm hiển thị tooltip hiện tại (ưu tiên điểm đang hover, nếu không hover thì hiện điểm cao nhất)
  const activePoint =
    hoveredIndex !== null ? points[hoveredIndex] : highestPoint;

  return (
    <div className="lg:col-span-2 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-gray-50/50 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-charcoal dark:text-white">
            {titleText}
          </h3>
          <p className="text-sm text-gray-500">
            {noteText}:{" "}
            <span className="font-bold text-charcoal dark:text-gray-300">
              {data.totalWeekly}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {period === "year" && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="h-8 w-20 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-600 outline-none transition-colors focus:border-orange-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              min="2000"
              max="2100"
              placeholder="Năm"
            />
          )}
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as ProfitPeriod)}
            className="h-8 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 pl-3 pr-8 text-xs font-medium text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:border-orange-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <option value="this_week">Tuần này</option>
            <option value="last_week">Tuần trước</option>
            <option value="last_month">Tháng trước</option>
            <option value="year">Năm</option>
          </select>
        </div>
      </div>

      <div className="relative h-[280px] w-full">
        <svg
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <defs>
            <linearGradient
              id="gradientPrimary"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f7b297" stopOpacity="0.3"></stop>
              <stop offset="100%" stopColor="#f7b297" stopOpacity="0"></stop>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            stroke="#f3f4f6"
            strokeWidth="1"
            x1="0"
            x2={chartWidth}
            y1={chartHeight}
            y2={chartHeight}
          ></line>
          <line
            stroke="#f3f4f6"
            strokeDasharray="4 4"
            strokeWidth="1"
            x1="0"
            x2={chartWidth}
            y1={chartHeight * 0.75}
            y2={chartHeight * 0.75}
          ></line>
          <line
            stroke="#f3f4f6"
            strokeDasharray="4 4"
            strokeWidth="1"
            x1="0"
            x2={chartWidth}
            y1={chartHeight * 0.5}
            y2={chartHeight * 0.5}
          ></line>
          <line
            stroke="#f3f4f6"
            strokeDasharray="4 4"
            strokeWidth="1"
            x1="0"
            x2={chartWidth}
            y1={chartHeight * 0.25}
            y2={chartHeight * 0.25}
          ></line>

          {/* Area fill */}
          <path d={areaPath} fill="url(#gradientPrimary)"></path>

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#f7b297"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          ></path>

          {/* Render các điểm tương tác (cả điểm đang hover và điểm cao nhất) */}
          {points.map((point, index) => {
            const isActive =
              hoveredIndex === index ||
              (hoveredIndex === null && point === highestPoint);
            return (
              <g key={`point-${index}`}>
                {/* Vòng tròn tàng hình to hơn để dễ hover chuột vào */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Chỉ hiển thị chấm tròn thực sự nếu nó đang active */}
                {isActive && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="#fff"
                    r="6"
                    stroke="#f7b297"
                    strokeWidth="3"
                    className="pointer-events-none transition-all duration-200"
                  />
                )}
              </g>
            );
          })}

          {/* Tooltip động (Chạy theo activePoint) */}
          {activePoint && (
            <g className="pointer-events-none transition-all duration-200">
              <rect
                fill="#474A53"
                height="30"
                rx="6"
                width="80"
                x={activePoint.x - 40}
                y={activePoint.y - 40}
              ></rect>
              <text
                fill="white"
                fontFamily="Inter, sans-serif"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                x={activePoint.x}
                y={activePoint.y - 18}
              >
                {activePoint.value.toLocaleString("vi-VN")}
              </text>
              <polygon
                fill="#474A53"
                points={`${activePoint.x},${activePoint.y - 5} ${activePoint.x - 5},${activePoint.y - 10} ${activePoint.x + 5},${activePoint.y - 10}`}
              ></polygon>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-4 flex justify-between px-2 text-xs font-semibold text-gray-400">
        {data.days.map((day, idx) => (
          <span key={idx}>{day}</span>
        ))}
      </div>
    </div>
  );
};
