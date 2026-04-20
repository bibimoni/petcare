import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { sidebarUser } from "@/lib/user";

import { CancelledOrderModal } from "./cancelled-order-modal";
import { OrderDetailModal } from "./completed-order-modal";
import { historyTransactions, type HistoryTransaction } from "./mock-data";
import { PendingOrderModal } from "./pending-order-modal";

const PosHistoryPage = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("10/01/2023");
  const [toDate, setToDate] = useState("10/31/2023");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // State quản lý việc mở modal giao dịch
  const [selectedTx, setSelectedTx] = useState<HistoryTransaction | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const currentShift = useMemo(() => {
    const hour = currentTime.getHours();

    if (hour >= 8 && hour < 12) {
      return {
        label: "Ca sáng",
        timeRange: "08:00 - 12:00",
      };
    }

    if (hour >= 13 && hour < 17) {
      return {
        label: "Ca chiều",
        timeRange: "13:00 - 17:00",
      };
    }

    return {
      label: "Ngoài ca",
      timeRange: "08:00 - 12:00 | 13:00 - 17:00",
    };
  }, [currentTime]);

  const handleExportExcel = () => {
    const dataToExport = searchTerm.trim()
      ? historyTransactions.filter(
          (tx) =>
            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : historyTransactions;

    const headers = [
      "Mã Hóa Đơn",
      "Khách Hàng",
      "SĐT",
      "Thú Cưng",
      "Tổng Tiền",
      "Ngày",
      "Giờ",
      "Trạng Thái",
    ];

    const rows = dataToExport.map((tx) => [
      tx.id,
      tx.customerName,
      tx.customerPhone,
      tx.pet,
      tx.total,
      tx.date,
      tx.time,
      tx.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `lich-su-hoa-don-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-[#f0e6df] bg-[#faf7f5]/90 px-6 backdrop-blur-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cb8f6a]">
              POS
            </p>
            <h1 className="text-base font-bold text-[#2f231d]">
              Lịch sử hóa đơn
            </h1>
          </div>

          <div className="relative w-full max-w-xl">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#be9477]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã hóa đơn hoặc SĐT khách hàng..."
              className="h-10 w-full rounded-full border border-[#ecdcd1] bg-[#fdfaf8] pl-12 pr-4 text-sm text-[#523c30] outline-none transition focus:border-[#dcae8c] focus:ring-2 focus:ring-[#f3d8c4]"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#ecdcd1] bg-white text-[#7a5f50] transition hover:bg-[#f9f0ea]"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="text-right">
              <p className="text-xs text-[#9a7a67]">{currentShift.label}</p>
              <p className="text-sm font-semibold text-[#4a362c]">
                {currentShift.timeRange}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {/* Back button */}
            <button
              onClick={() => navigate("/pos")}
              className="flex w-fit cursor-pointer items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#a07f6b] transition hover:text-[#7f5d47]"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              QUAY LẠI
            </button>

            {/* Page Header */}
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#2f231d]">
                  Lịch sử hóa đơn đã thanh toán
                </h1>
                <p className="mt-1 text-sm text-[#9f7d67]">
                  Quản lý và tra cứu tất cả các giao dịch đã hoàn tất tại cửa
                  hàng.
                </p>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex gap-3 rounded-xl bg-white p-1.5 shadow-sm">
                  <div className="flex flex-col px-2">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                      TỪ NGÀY
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-24 text-sm font-bold text-[#2f231d] outline-none"
                      />
                      <span className="material-symbols-outlined text-[18px] text-[#2f231d]">
                        calendar_today
                      </span>
                    </div>
                  </div>
                  <div className="w-[1px] bg-[#f0e6df]" />
                  <div className="flex flex-col px-2">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                      ĐẾN NGÀY
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-24 text-sm font-bold text-[#2f231d] outline-none"
                      />
                      <span className="material-symbols-outlined text-[18px] text-[#2f231d]">
                        calendar_today
                      </span>
                    </div>
                  </div>
                </div>
                <button className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-600/80 px-6 text-sm font-bold text-white transition hover:bg-orange-600/60 shadow-[0_4px_12px_rgba(245,168,130,0.3)]">
                  <span className="material-symbols-outlined text-[18px]">
                    filter_alt
                  </span>
                  Lọc dữ liệu
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                TỔNG DOANH THU THÁNG
              </p>
              <p className="mt-2 text-2xl font-black text-[#2f231d]">
                128.450.000đ
              </p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e6f7f1] px-2 py-0.5 text-xs font-bold text-[#1f8c6e]">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>
                +12.5%
              </div>
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[80px] text-[#f7f3f1] opacity-50">
                payments
              </span>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                TỔNG SỐ HÓA ĐƠN
              </p>
              <p className="mt-2 text-2xl font-black text-[#2f231d]">432</p>
              <p className="mt-3 text-xs text-[#9f7d67]">
                Trung bình 14 đơn/ngày
              </p>
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[80px] text-[#f7f3f1] opacity-50">
                receipt_long
              </span>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                LƯỢT THÚ CƯNG
              </p>
              <p className="mt-2 text-2xl font-black text-[#2f231d]">386</p>
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[80px] text-[#f7f3f1] opacity-50">
                pets
              </span>
            </div>

            <div className="rounded-2xl bg-[#e6f4f1] p-5 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#407a68]">
                KHÁCH HÀNG MỚI
              </p>
              <p className="mt-2 text-2xl font-black text-[#1e5c4a]">48</p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold text-[#1e5c4a]">
                <span className="material-symbols-outlined text-[14px]">
                  add_circle
                </span>
                Tháng này
              </div>
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[80px] text-[#c9e8df] opacity-50">
                star
              </span>
            </div>
          </div>

          {/* Data Table Area */}
          <div className="rounded-2xl bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="relative w-[400px]">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[#be9477]">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo mã hóa đơn hoặc SĐT khách hàng..."
                  className="h-10 w-full rounded-full bg-[#fdfaf8] pl-11 pr-4 text-sm text-[#523c30] outline-none transition focus:ring-1 focus:ring-[#f3d8c4]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExportExcel}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#fdfaf8] px-5 text-sm font-bold text-[#2f231d] transition hover:bg-[#f5ebe5]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    download
                  </span>
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f0e6df] text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                    <th className="py-4 pr-4">MÃ HÓA ĐƠN</th>
                    <th className="p-4">KHÁCH HÀNG</th>
                    <th className="p-4">THÚ CƯNG</th>
                    <th className="p-4">TỔNG TIỀN</th>
                    <th className="p-4">THỜI GIAN</th>
                    <th className="p-4">TRẠNG THÁI</th>
                    <th className="py-4 pl-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {historyTransactions
                    .filter(
                      (tx) =>
                        tx.id
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        tx.customerPhone
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        tx.customerName
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )
                    .map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="cursor-pointer border-b border-[#f9f5f3] last:border-0 hover:bg-[#fcfafa] transition-colors"
                      >
                        <td className="py-4 pr-4 font-black text-[#2f231d]">
                          {tx.id}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5ebe5] text-xs font-bold text-[#967867]">
                              {tx.customerInitials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#2f231d]">
                                {tx.customerName}
                              </p>
                              <p className="text-xs text-[#a07f6b]">
                                {tx.customerPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-[#523c30]">
                            <span className="material-symbols-outlined text-[16px] text-[#c9a793]">
                              pets
                            </span>
                            {tx.pet}
                          </div>
                        </td>
                        <td className="p-4 font-black text-[#2f231d]">
                          {tx.total}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-[#2f231d]">{tx.date}</p>
                          <p className="text-xs text-[#a07f6b]">{tx.time}</p>
                        </td>
                        <td className="p-4">
                          {/* Map status qua Badge */}
                          {tx.status === "COMPLETED" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7f1] px-2.5 py-1 text-[10px] font-bold text-[#1f8c6e]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#1f8c6e]"></span>
                              Đã thanh toán
                            </div>
                          )}
                          {tx.status === "PENDING" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-100 px-2.5 py-1 text-[10px] font-bold text-yellow-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                              Chờ thanh toán
                            </div>
                          )}
                          {tx.status === "CANCELLED" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              Đã hủy
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[#f0e6df] p-4">
              <p className="text-xs text-[#a07f6b]">
                Hiển thị 1 -{" "}
                {
                  historyTransactions.filter(
                    (tx) =>
                      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      tx.customerPhone
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      tx.customerName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                  ).length
                }{" "}
                của {historyTransactions.length} hóa đơn
              </p>
              <div className="flex items-center gap-1 text-sm font-bold">
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f5ebe5]">
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_left
                  </span>
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5a882] text-white">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#523c30] hover:bg-[#f5ebe5]">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#523c30] hover:bg-[#f5ebe5]">
                  3
                </button>
                <span className="flex h-8 w-8 items-center justify-center text-[#a07f6b]">
                  ...
                </span>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#523c30] hover:bg-[#f5ebe5]">
                  44
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f5ebe5]">
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- KHU VỰC CHỨA CÁC MODALS TRẠNG THÁI --- */}
        <OrderDetailModal
          isOpen={selectedTx?.status === "COMPLETED"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
          onStatusChange={() => {}}
        />

        <PendingOrderModal
          isOpen={selectedTx?.status === "PENDING"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
          onStatusChange={() => {}}
        />

        <CancelledOrderModal
          isOpen={selectedTx?.status === "CANCELLED"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
        />
      </main>
    </div>
  );
};

export default PosHistoryPage;
