// Mock Chart
import { Button } from "@/components/ui/button";

import { type RevenueData } from "../api/dashboard-api";

interface RevenueChartProps {
  data: RevenueData;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  // Calculate chart path based on values
  const maxValue = Math.max(...data.values);
  const chartHeight = 280;
  const chartWidth = 800;
  const padding = 20;

  // Generate SVG path for the line chart
  const points = data.values.map((value, index) => {
    const x =
      (index / (data.values.length - 1)) * (chartWidth - padding * 2) + padding;
    const y =
      chartHeight - (value / maxValue) * (chartHeight - padding * 2) - padding;
    return { x, y, value };
  });

  // Create line path
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  // Create fill area path
  const areaPath = `${linePath} L${points[points.length - 1].x},${chartHeight} L${points[0].x},${chartHeight} Z`;

  // Find the highest point for tooltip
  const highestPoint = points.reduce((prev, current) =>
    prev.value > current.value ? prev : current,
  );

  return (
    <div className="lg:col-span-2 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-gray-50/50 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-charcoal dark:text-white">
            Doanh thu 7 ngày qua
          </h3>
          <p className="text-sm text-gray-500">
            Tổng thu:{" "}
            <span className="font-bold text-charcoal dark:text-gray-300">
              {data.totalWeekly}
            </span>
          </p>
        </div>
        <Button className="flex items-center gap-1 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Tuần này
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </Button>
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

          {/* Highlight point */}
          <circle
            cx={highestPoint.x}
            cy={highestPoint.y}
            fill="#fff"
            r="6"
            stroke="#f7b297"
            strokeWidth="3"
          ></circle>

          {/* Tooltip */}
          <rect
            fill="#474A53"
            height="30"
            rx="6"
            width="70"
            x={highestPoint.x - 35}
            y={highestPoint.y - 40}
          ></rect>
          <text
            fill="white"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            x={highestPoint.x}
            y={highestPoint.y - 18}
          >
            {highestPoint.value.toFixed(1)}tr
          </text>
          <polygon
            fill="#474A53"
            points={`${highestPoint.x},${highestPoint.y - 5} ${highestPoint.x - 5},${highestPoint.y - 10} ${highestPoint.x + 5},${highestPoint.y - 10}`}
          ></polygon>
        </svg>
      </div>

      <div className="mt-4 flex justify-between px-2 text-xs font-semibold text-gray-400">
        {data.days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
};
