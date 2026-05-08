import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, BarChart3 } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getDashboardRevenue } from "@/features/dashboard/api/dashboard-api";
import { RevenueChart } from "@/features/dashboard/components/revenue-chart";
import { OrderDetailModal } from "@/features/pos/completed-order-modal";
import { queryClient } from "@/lib/query-client";

import { fetchFinanceData } from "./api/finance.api";
import { FinanceSummaryCards } from "./components/finance-summary-cards";
import { ProfitDetailsTable } from "./components/profit-details-table";
import { RevenueStructureChart } from "./components/revenue-structure-chart";

const FinancePage = () => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState<string>(
    () => new Date().toISOString().split("T")[0],
  );

  // States for the Monthly Chart (reusing dashboard component logic)
  const [chartPeriod, setChartPeriod] = useState<any>("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch main financial data
  const { data: financeData, isLoading: isFinanceLoading } = useQuery({
    queryKey: ["finance-data", fromDate, toDate],
    queryFn: async () => {
      setCurrentPage(1); // Reset page when filters change
      return fetchFinanceData(fromDate, toDate);
    },
  });

  // Paginate profit details client-side
  const paginatedProfitDetails = useMemo(() => {
    if (!financeData) return [];
    const start = (currentPage - 1) * pageSize;
    return financeData.profitDetails.slice(start, start + pageSize);
  }, [financeData, currentPage]);

  const totalPages = Math.ceil(
    (financeData?.profitDetails.length || 0) / pageSize,
  );
  const totalItems = financeData?.profitDetails.length || 0;

  // Fetch chart data (reusing dashboard API)
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ["finance-revenue-chart", chartPeriod, selectedYear],
    queryFn: () => getDashboardRevenue(chartPeriod, selectedYear),
  });

  const handleItemClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (!financeData) return;

    const headers = [
      "Ngày GD",
      "Mã đơn",
      "Khách hàng",
      "Doanh thu",
      "Giá vốn",
      "Lợi nhuận",
      "Trạng thái",
    ];
    const rows = financeData.profitDetails.map((item) => [
      new Date(item.date).toLocaleDateString("vi-VN"),
      item.id,
      item.customerName,
      item.revenue,
      item.cogs,
      item.profit,
      item.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `bao-cao-tai-chinh-${fromDate}-den-${toDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf7f5] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {/* Page Filter Toolbar */}
        <div className="h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              Báo cáo tài chính
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Theo dõi sức khỏe kinh doanh của cửa hàng
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-100 dark:border-gray-700">
              <div className="px-4 py-1">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  Từ ngày
                </p>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-black text-gray-700 dark:text-gray-200 outline-none w-32 cursor-pointer"
                />
              </div>
              <div className="w-[1px] h-8 bg-gray-200 dark:bg-gray-700 self-center" />
              <div className="px-4 py-1">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  Đến ngày
                </p>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-black text-gray-700 dark:text-gray-200 outline-none w-32 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isFinanceLoading || !financeData}
              className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-[18px] h-[18px]" />
              <span>Xuất báo cáo</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#faf7f5] dark:bg-gray-950">
          {isFinanceLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
          ) : financeData ? (
            <>
              {/* Stats Cards */}
              <FinanceSummaryCards stats={financeData.stats} />

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative">
                  {isChartLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] rounded-2xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                    </div>
                  )}
                  <div className="bg-white">
                    <RevenueChart
                      titleText="Doanh thu theo thời gian"
                      noteText="Tổng doanh thu"
                      data={
                        chartData || { days: [], values: [], totalWeekly: "0đ" }
                      }
                      period={chartPeriod}
                      selectedYear={selectedYear}
                      onYearChange={setSelectedYear}
                      onPeriodChange={setChartPeriod}
                    />
                  </div>
                </div>
                <div>
                  <RevenueStructureChart data={financeData.revenueStructure} />
                </div>
              </div>

              {/* Transaction Details */}
              <ProfitDetailsTable
                items={paginatedProfitDetails}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onItemClick={handleItemClick}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BarChart3 className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold">
                Không có dữ liệu cho khoảng thời gian này
              </p>
            </div>
          )}
          <Footer />
        </div>
      </main>

      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={selectedOrderId}
        onStatusChange={() => {
          queryClient.invalidateQueries({
            queryKey: ["finance-data", fromDate, toDate],
          });
        }}
      />
    </div>
  );
};

export default FinancePage;
