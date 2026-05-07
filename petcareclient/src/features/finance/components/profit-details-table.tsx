import { useMemo, useState } from "react";

import { type ProfitDetailItem } from "../api/finance.api";

interface ProfitDetailsTableProps {
  pageSize: number;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  items: ProfitDetailItem[];
  onPageChange: (page: number) => void;
}

const formatPrice = (amount: number) => {
  return `${amount.toLocaleString("vi-VN")}đ`;
};

export const ProfitDetailsTable = ({
  items,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize,
}: ProfitDetailsTableProps) => {
  const [jumpPage, setJumpPage] = useState("");

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(startItem + items.length - 1, totalItems);

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-700">
        <h3 className="text-lg font-black text-[#2f231d] dark:text-white">
          Chi tiết lợi nhuận
        </h3>
      </div>

      <div className="overflow-x-auto px-4 pb-2">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-[#a07f6b] dark:text-gray-400 uppercase tracking-[0.2em] border-b border-[#f0e6df] dark:border-gray-700">
              <th className="px-4 py-5">NGÀY GD</th>
              <th className="px-4 py-5">MÃ ĐƠN</th>
              <th className="px-4 py-5">KHÁCH HÀNG</th>
              <th className="px-4 py-5 text-right">DOANH THU</th>
              <th className="px-4 py-5 text-right">GIÁ VỐN</th>
              <th className="px-4 py-5 text-right">LỢI NHUẬN</th>
              <th className="px-4 py-5 text-center">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-[#fcfafa] dark:hover:bg-gray-700/50 transition-colors group border-b border-[#f9f5f3] last:border-0"
              >
                <td className="px-4 py-4 text-sm font-medium text-[#523c30] dark:text-gray-400">
                  {new Date(item.date).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm font-black text-[#2f231d] dark:text-white">
                  #{item.id}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f5ebe5] dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-[#967867] dark:text-gray-400 overflow-hidden">
                      {item.customerAvatar ? (
                        <img
                          src={item.customerAvatar}
                          alt={item.customerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.customerName.charAt(0)
                      )}
                    </div>
                    <span className="text-sm font-bold text-[#2f231d] dark:text-white">
                      {item.customerName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-black text-[#2f231d] dark:text-white text-right">
                  {formatPrice(item.revenue)}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#b45309] dark:text-red-300 text-right">
                  {formatPrice(item.cogs)}
                </td>
                <td className="px-4 py-4 text-sm font-black text-[#059669] dark:text-emerald-400 text-right">
                  +{formatPrice(item.profit)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      item.status === "PAID" || item.status === "COMPLETED"
                        ? "bg-[#e6f7f1] text-[#1f8c6e] dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                    }`}
                  >
                    {(item.status === "PAID" ||
                      item.status === "COMPLETED") && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1f8c6e]" />
                    )}
                    {item.status === "PAID" || item.status === "COMPLETED"
                      ? "Hoàn thành"
                      : "Chờ XL"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination UI from history-page.tsx */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f0e6df] dark:border-gray-700 p-4">
        <p className="shrink-0 text-xs text-[#a07f6b] font-medium">
          Hiển thị {startItem} - {endItem} của {totalItems} hóa đơn
        </p>

        <div className="flex flex-wrap items-center justify-end gap-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f5ebe5] dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
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
                onClick={() => onPageChange(item as number)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  item === currentPage
                    ? "bg-[#f5a882] text-white shadow-sm"
                    : "text-[#523c30] hover:bg-[#f5ebe5] dark:hover:bg-gray-700"
                }`}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f5ebe5] dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>

          {totalPages > 7 && (
            <div className="ml-2 flex items-center gap-2 border-l border-[#f0e6df] dark:border-gray-700 pl-4">
              <span className="text-[10px] font-bold text-[#a07f6b] uppercase tracking-wider">
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
                      onPageChange(page);
                      setJumpPage("");
                    }
                  }
                }}
                className="h-8 w-12 rounded-lg border border-[#ecdcd1] dark:border-gray-700 bg-white dark:bg-gray-900 px-1 text-center text-xs font-bold text-[#523c30] dark:text-gray-200 outline-none transition focus:border-[#f5a882]"
                placeholder="..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
