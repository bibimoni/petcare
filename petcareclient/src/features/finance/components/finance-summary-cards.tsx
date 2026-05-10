import {
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingBag,
  TrendingDown,
} from "lucide-react";

import { type FinanceStats } from "../api/finance.api";

interface FinanceSummaryCardsProps {
  stats: FinanceStats;
}

const formatValue = (val: number) => {
  if (val >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(1) + "tỷ";
  }
  if (val >= 1_000_000) {
    return (val / 1_000_000).toFixed(1) + "tr";
  }
  return val.toLocaleString("vi-VN") + "đ";
};

export const FinanceSummaryCards = ({ stats }: FinanceSummaryCardsProps) => {
  const cards = [
    {
      title: "Tổng doanh thu",
      value: formatValue(stats.totalRevenue),
      growth: stats.revenueGrowth,
      icon: <DollarSign className="w-6 h-6 text-orange-500" />,
      iconBg: "bg-orange-50",
      indicatorColor: "bg-orange-500",
    },
    {
      title: "Đơn hàng hoàn thành",
      value: stats.completedOrders.toLocaleString(),
      growth: stats.ordersGrowth,
      icon: <ShoppingBag className="w-6 h-6 text-blue-500" />,
      iconBg: "bg-blue-50",
      indicatorColor: "bg-blue-500",
    },
    {
      title: "Lợi nhuận ròng",
      value: formatValue(stats.grossProfit),
      growth: stats.profitGrowth,
      icon: <CreditCard className="w-6 h-6 text-yellow-500" />,
      iconBg: "bg-yellow-50",
      indicatorColor: "bg-yellow-500",
      showProfitBar: true,
      profitPercentage: (stats.grossProfit / (stats.totalRevenue || 1)) * 100,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {card.title}
              </p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                {card.value}
              </h3>
            </div>
            <div
              className={`p-3 rounded-2xl ${card.iconBg} dark:bg-gray-700/50`}
            >
              {card.icon}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                card.growth >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {card.growth >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {card.growth >= 0 ? "+" : ""}
              {card.growth.toFixed(1)}%
            </div>
            <span className="text-xs text-gray-400 font-medium">
              so với tháng trước
            </span>
          </div>

          {card.showProfitBar && (
            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <span>Tỷ suất lợi nhuận</span>
                <span>{card.profitPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${card.indicatorColor} transition-all duration-1000`}
                  style={{
                    width: `${Math.min(100, Math.max(0, card.profitPercentage))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
