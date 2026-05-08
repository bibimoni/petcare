/* eslint-disable */
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Filter, 
  PawPrint, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getOrders, type OrderListItemDto } from "@/features/pos/api";
import { useSearch } from "@/lib/search-context";

import { CancelledOrderModal } from "./cancelled-order-modal";
import { OrderDetailModal } from "./completed-order-modal";
import { PendingOrderModal } from "./pending-order-modal";
import { RefundedOrderModal } from "./refunded-order-modal";

type HistoryTransaction = {
  cancel_reason?: string;
  customerInitials: string;
  customerName: string;
  customerPhone: string;
  date: string;
  id: string;
  numericId: number;
  pet: string;
  status: "PAID" | "CANCELLED" | "PENDING" | "REFUNDED";
  time: string;
  total: string;
};

const formatVND = (value: string | number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value))}đ`;

const toDateParts = (dateString: string) => {
  const date = new Date(dateString);

  return {
    date: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

const getCustomerInitials = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed) return "KL";

  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const summarizeOrderItems = (
  orderDetails: OrderListItemDto["order_details"],
) => {
  if (orderDetails.length === 0) return "Không có mặt hàng";

  const firstItem = orderDetails[0];
  const firstName =
    firstItem.item_type === "SERVICE"
      ? (firstItem.service?.combo_name ?? "Dịch vụ")
      : (firstItem.product?.name ?? "Sản phẩm");

  if (orderDetails.length === 1) {
    return `${firstName} x${firstItem.quantity}`;
  }

  return `${firstName} x${firstItem.quantity} +${orderDetails.length - 1} mục khác`;
};

const getOrderStatus = (status: string) => {
  if (status === "CANCELLED") {
    return "CANCELLED"
  }

  if (status === "REFUNDED") {
    return "REFUNDED"
  }

  return status as "PAID" | "CANCELLED" | "PENDING";
};

const mapOrderToHistoryTransaction = (
  order: OrderListItemDto,
): HistoryTransaction => {
  const customerName = order.customer?.full_name ?? "Khách lẻ";
  const phone = order.customer?.phone ?? "--";
  const { date, time } = toDateParts(order.created_at);
  return {
    customerInitials: getCustomerInitials(customerName),
    customerName,
    customerPhone: phone,
    date,
    id: `POS-${String(order.order_id).padStart(4, "0")}`,
    numericId: order.order_id,
    pet: summarizeOrderItems(order.order_details),
    status: getOrderStatus(order?.status),
    time,
    total: formatVND(order.total_amount),
  };
};

const sumOrderRevenue = (orders: OrderListItemDto[] | undefined) =>
  (orders ?? []).reduce(
    (sum, order) => sum + Number(order.total_amount ?? 0),
    0,
  );

const PosHistoryPage = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { searchQuery, setSearchQuery } = useSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedTx, setSelectedTx] = useState<HistoryTransaction | null>(null);
  const pageSize = 10;

  const formatDateForApi = (input: string | null | undefined) => {
    if (!input) return undefined;
    const parsed = new Date(String(input));
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString().split("T")[0];
  };

  const formattedFrom = formatDateForApi(fromDate);
  const formattedTo = formatDateForApi(toDate);

  const handleClearFilters = () => {
    setFromDate(null);
    setToDate(null);
    setStatusFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: [
      "pos-orders",
      currentPage,
      pageSize,
      formattedFrom,
      formattedTo,
      statusFilter,
    ],
    queryFn: () =>
      getOrders(currentPage, pageSize, {
        status: statusFilter,
        date_from: formattedFrom,
        date_to: formattedTo,
      }),
  });

  const totalMatchingOrders = ordersResponse?.total ?? 0;

  const { data: allOrdersResponse } = useQuery({
    queryKey: [
      "pos-orders-all",
      formattedFrom,
      formattedTo,
      statusFilter,
      totalMatchingOrders,
    ],
    queryFn: () =>
      getOrders(1, totalMatchingOrders, {
        status: statusFilter,
        date_from: formattedFrom,
        date_to: formattedTo,
      }),
    enabled: totalMatchingOrders > 0,
  });

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

  const transactions = useMemo(() => {
    const orders = ordersResponse?.data ?? [];
    const mapped = orders.map(mapOrderToHistoryTransaction);

    if (!searchQuery.trim()) {
      return mapped;
    }

    const keyword = searchQuery.toLowerCase();

    return mapped.filter(
      (tx) =>
        tx.id.toLowerCase().includes(keyword) ||
        tx.customerPhone.toLowerCase().includes(keyword) ||
        tx.customerName.toLowerCase().includes(keyword) ||
        tx.pet.toLowerCase().includes(keyword),
    );
  }, [ordersResponse?.data, searchQuery]);

  const getUniqueCustomersCount = (orders: OrderListItemDto[] | undefined) => {
    const set = new Set<number>();
    (orders ?? []).forEach((o) => {
      const cid = (o.customer as any)?.customer_id ?? (o as any).customer_id;
      if (cid != null) set.add(Number(cid));
    });
    return set.size;
  };

  const getUniquePetsCount = (orders: OrderListItemDto[] | undefined) => {
    const set = new Set<number>();
    (orders ?? []).forEach((o) => {
      (o.order_details ?? []).forEach((d: any) => {
        const pid = d?.pet_id ?? null;
        if (pid != null) set.add(Number(pid));
      });
    });
    return set.size;
  };

  const uniqueCustomers = getUniqueCustomersCount(ordersResponse?.data);
  const uniquePets = getUniquePetsCount(ordersResponse?.data);
  const totalRevenue = sumOrderRevenue(allOrdersResponse?.data);

  const totalPages = ordersResponse?.pages ?? 1;
  const totalOrders = ordersResponse?.total ?? 0;
  const startItem = totalOrders === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = startItem + transactions.length - 1;
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const handleExportExcel = () => {
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

    const rows = transactions.map((tx) => [
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
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <Header />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <button
              type="button"
              onClick={() => navigate("/pos")}
              className="flex w-fit cursor-pointer items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#a07f6b] transition hover:text-[#7f5d47]"
            >
              <ArrowLeft className="w-4 h-4" />
              QUAY LẠI
            </button>

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
                        type="date"
                        value={fromDate ?? ""}
                        onChange={(e) => setFromDate(e.target.value || null)}
                        placeholder="Chọn ngày bắt đầu"
                        className="w-30 text-sm font-bold text-[#2f231d] outline-none"
                      />
                    </div>
                  </div>
                  <div className="w-[1px] bg-[#f0e6df]" />
                  <div className="flex flex-col px-2">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                      ĐẾN NGÀY
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={toDate ?? ""}
                        onChange={(e) => setToDate(e.target.value || null)}
                        placeholder="Chọn ngày kết thúc"
                        className="w-30 text-sm font-bold text-[#2f231d] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-md border border-[#ecdcd1] bg-white px-3 text-sm text-[#523c30] outline-none"
                  >
                    <option value="">Tất cả</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="PENDING">Chờ thanh toán</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="REFUNDED">Đã hoàn tiền</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-orange-600/80 px-4 text-sm font-bold text-white transition hover:bg-orange-600/60"
                  >
                    <Filter className="w-[18px] h-[18px]" />
                    Xoá bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                  TỔNG GIÁ TRỊ HOÁ ĐƠN
                </p>
                <p className="mt-2 text-2xl font-black text-[#2f231d]">
                  {formatVND(totalRevenue)}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                  TỔNG SỐ HÓA ĐƠN
                </p>
                <p className="mt-2 text-2xl font-black text-[#2f231d]">
                  {totalOrders}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07f6b]">
                  LƯỢT THÚ CƯNG
                </p>
                <p className="mt-2 text-2xl font-black text-[#2f231d]">
                  {uniquePets}
                </p>
                <PawPrint className="absolute -right-2 -bottom-2 w-20 h-20 text-[#f7f3f1] opacity-50" />
              </div>

              <div className="rounded-2xl bg-[#e6f4f1] p-5 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#407a68]">
                  LƯỢT KHÁCH HÀNG
                </p>
                <p className="mt-2 text-2xl font-black text-[#1e5c4a]">
                  {uniqueCustomers}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-2 shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="relative w-[400px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#be9477]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm theo mã hóa đơn hoặc SĐT khách hàng..."
                    className="h-10 w-full rounded-full bg-[#fdfaf8] pl-11 pr-4 text-sm text-[#523c30] outline-none transition focus:ring-1 focus:ring-[#f3d8c4]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#fdfaf8] px-5 text-sm font-bold text-[#2f231d] transition hover:bg-[#f5ebe5]"
                  >
                    <Download className="w-[18px] h-[18px]" />
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
                      <th className="p-4">MẶT HÀNG / DỊCH VỤ</th>
                      <th className="p-4">TỔNG TIỀN</th>
                      <th className="p-4">THỜI GIAN</th>
                      <th className="p-4">TRẠNG THÁI</th>
                      <th className="py-4 pl-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          className="py-10 text-center text-sm text-[#9f7d67]"
                          colSpan={7}
                        >
                          Đang tải dữ liệu...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td
                          className="py-10 text-center text-sm text-[#9f7d67]"
                          colSpan={7}
                        >
                          Không có dữ liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
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
                              <PawPrint className="w-4 h-4 text-[#c9a793]" />
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
                            {tx.status === "PAID" && (
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7f1] px-2.5 py-1 text-[10px] font-bold text-[#1f8c6e]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1f8c6e]" />
                                Đã thanh toán
                              </div>
                            )}
                            {tx.status === "PENDING" && (
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-100 bg-yellow-50 px-2.5 py-1 text-[10px] font-bold text-yellow-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                                Chờ thanh toán
                              </div>
                            )}
                            {tx.status === "REFUNDED" && (
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                Đã hoàn tiền
                              </div>
                            )}
                            {tx.status === "CANCELLED" && (
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Đã hủy
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f0e6df] p-4">
                <p className="shrink-0 text-xs text-[#a07f6b]">
                  Hiển thị {totalOrders === 0 ? 0 : startItem} -{" "}
                  {totalOrders === 0 ? 0 : endItem} của {totalOrders} hóa đơn
                </p>

                <div className="flex flex-wrap items-center justify-end gap-1 text-sm font-bold">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {paginationItems.map((item, index) => {
                    if (item === "...") {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex h-8 w-8 items-center justify-center text-[#a07f6b]"
                        >
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item as number)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${item === currentPage ? "bg-[#f5a882] text-white" : "text-[#523c30] hover:bg-[#f5ebe5]"}`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Ô nhập số trang để nhảy nhanh (Chỉ hiện khi có quá nhiều trang) */}
                  {totalPages > 7 && (
                    <div className="ml-2 flex items-center gap-2 border-l border-[#f0e6df] pl-4">
                      <span className="text-xs font-normal text-[#a07f6b]">
                        Đến trang:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpPage}
                        onChange={(e) => setJumpPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const page = parseInt(jumpPage, 10);
                            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                              setJumpPage("");
                            }
                          }
                        }}
                        className="h-8 w-14 rounded-md border border-[#ecdcd1] bg-white px-1 text-center text-sm font-normal text-[#523c30] outline-none transition focus:border-[#f5a882] focus:ring-1 focus:ring-[#f5a882]"
                        placeholder="..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>

        <OrderDetailModal
          isOpen={selectedTx?.status === "PAID"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
          onStatusChange={() => setCurrentPage(1)}
        />

        <PendingOrderModal
          isOpen={selectedTx?.status === "PENDING"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
          onStatusChange={() => setCurrentPage(1)}
        />

        <CancelledOrderModal
          isOpen={selectedTx?.status === "CANCELLED"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
        />

        <RefundedOrderModal
          isOpen={selectedTx?.status === "REFUNDED"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
        />
      </main>
    </div>
  );
};

export default PosHistoryPage;
