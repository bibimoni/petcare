import type { JSX } from "react";

interface StatsCardProps {
  label: string;
  suffix?: string;
  iconColor?: string;
  iconBgColor?: string;
  value: string | number;
  icon: string | JSX.Element;
  decorativeElement?: "circle" | "none";
  trend?: {
    label: string;
    value: string | number;
    direction: "up" | "down";
  };
}

export const StatsCard = ({
  label,
  value,
  suffix,
  icon,
  iconBgColor,
  iconColor,
  trend,
  decorativeElement,
}: StatsCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-gray-50/50 dark:border-gray-700 hover:shadow-md transition-shadow">
      {decorativeElement === "circle" && (
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10"></div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-charcoal dark:text-white tracking-tight">
            {value}
            {suffix && (
              <span className="text-lg font-semibold text-gray-400 ml-2">
                {suffix}
              </span>
            )}
          </h3>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColor} text-${iconColor}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm relative z-10">
          <span
            className={`flex items-center font-bold ${
              trend.direction === "up"
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600"
            }`}
          >
            {trend.direction === "up" && (
              <span className="material-symbols-outlined text-lg">
                trending_up
              </span>
            )}
            {typeof trend.value === "string" && trend.value.startsWith("+")
              ? trend.value
              : trend.direction === "up"
                ? `+${trend.value}`
                : trend.value}
          </span>
          <span className="text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
};
