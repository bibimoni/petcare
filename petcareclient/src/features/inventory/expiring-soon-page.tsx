import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Search,
  Filter,
  Package,
  Loader2,
  ArrowLeft,
  CalendarX,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { getInventoryAlertsData } from "@/features/inventory/api/products.api";
import { AlertDialog } from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { queryClient } from "@/lib/query-client";


interface ExpiringAlert {
  sku?: string;
  name: string;
  product_id: number;
  expiry_date: string;
  category_id?: number;
  stock_quantity: number;

  daysLeft: number;
  image_url: string;
  hasDiscount: boolean;
  expiryFormatted: string;
  level: "severe" | "warning" | "notice" | "normal";
}

export default function ExpiringSoonPage() {
  const navigate = useNavigate();
  const alertsQuery = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: getInventoryAlertsData,
    staleTime: 2 * 60 * 1000,
  });

  const categories = alertsQuery.data?.categories ?? [];
  const isLoading = alertsQuery.isPending;

  // States quản lý tìm kiếm & lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // THÊM STATE PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ITEMS_PER_PAGE = 5;


  const items = useMemo(() => {
    const now = new Date();
    const alerts = alertsQuery.data?.alerts ?? [];

    const formattedData: ExpiringAlert[] = alerts
      .filter((product) => !!product.expiry_date)
      .map((product) => {
        const expiryDate = new Date(String(product.expiry_date));
        const timeDiff = expiryDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        let level: ExpiringAlert["level"] = "normal";
        if (daysLeft <= 7) level = "severe";
        else if (daysLeft <= 15) level = "warning";
        else if (daysLeft <= 30) level = "notice";

        return {
          ...product,
          name: String(product.name ?? "Sản phẩm"),
          product_id: Number(product.product_id),
          category_id: product.category_id
            ? Number(product.category_id)
            : undefined,
          stock_quantity: Number(product.stock_quantity ?? 0),
          daysLeft,
          level,
          expiry_date: String(product.expiry_date),
          expiryFormatted: expiryDate.toLocaleDateString("vi-VN"),
          image_url:
            product.image_url ||
            "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
          hasDiscount: false,
        };
      })
      .filter((product) => product.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return formattedData;
  }, [alertsQuery.data?.alerts]);

  const stats = useMemo(() => {
    return {
      severeCount: items.filter((product) => product.daysLeft <= 7).length,
      warningCount: items.filter(
        (product) => product.daysLeft > 7 && product.daysLeft <= 30,
      ).length,
      totalRiskStock: items.reduce(
        (accumulator, product) => accumulator + Number(product.stock_quantity),
        0,
      ),
    };
  }, [items]);

  // HÀM LỌC TỰ ĐỘNG
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Lọc theo từ khóa
      const lowerSearch = searchTerm.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(lowerSearch);

      // 2. Lọc theo thời gian
      let matchTime = true;
      if (timeFilter === "7days") matchTime = item.daysLeft <= 7;
      else if (timeFilter === "30days") matchTime = item.daysLeft <= 30;

      // 3. Lọc theo danh mục
      let matchCategory = true;
      if (categoryFilter !== "all") {
        matchCategory = item.category_id === Number(categoryFilter);
      }

      return matchSearch && matchTime && matchCategory;
    });
  }, [items, searchTerm, timeFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, timeFilter, categoryFilter]);

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // HÀM TRA CỨU TÊN DANH MỤC
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Khác";
    const category = categories.find(
      (item) => Number(item.category_id) === Number(categoryId),
    );
    return category ? category.name : "Khác";
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((item) => item.product_id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // Loop through deletions if no bulk endpoint
      await Promise.all(
        selectedIds.map((id) => api.delete(`/products/${id}`)),
      );
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm thành công!`);
      setSelectedIds([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-products"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] }),
      ]);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Lỗi khi xóa hàng loạt: " +
        (error.response?.data?.message || "Không xác định"),
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-background-light text-text-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-background-light shrink-0 z-10 border-b border-[#f3ebe7]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-text-secondary"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <span>Kho Hàng</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary-dark">Cảnh báo</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">
              Sản phẩm Sắp hết HSD
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input
              className="w-full bg-white border-none pl-10 pr-4 py-3 rounded-xl shadow-sm ring-1 ring-[#f3ebe7] focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400 text-sm transition-all"
              placeholder="Tìm kiếm sản phẩm..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col gap-6 mx-auto max-w-7xl">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {totalItems} sản phẩm cần chú ý
              </span>
              <p className="text-text-secondary text-sm hidden md:block">
                Sản phẩm sắp đến ngày hết hạn sử dụng
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-[#f3ebe7] text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer hover:bg-gray-50 h-11"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="7days">Hết hạn trong 7 ngày</option>
                  <option value="30days">Hết hạn trong 30 ngày</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-[#f3ebe7] text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer hover:bg-gray-50 h-11 max-w-[180px] truncate"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option
                      key={cat.category_id}
                      value={cat.category_id.toString()}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>

              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 h-11 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-100 shadow-sm animate-in fade-in slide-in-from-left-2 cursor-pointer"
                >
                  <Trash2 size={16} />
                  Xóa {selectedIds.length} đã chọn
                </button>
              )}
            </div>
          </div>

        </div>


        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-primary">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="font-medium">Đang kiểm tra hạn sử dụng...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
              <CalendarX className="h-12 w-12 text-gray-300 mb-4" />
              <p className="font-medium text-lg text-text-primary">
                {searchTerm ||
                  timeFilter !== "all" ||
                  categoryFilter !== "all"
                  ? "Không tìm thấy sản phẩm phù hợp bộ lọc"
                  : "Không có hàng sắp hết hạn"}
              </p>
              <p className="text-sm">
                {searchTerm ||
                  timeFilter !== "all" ||
                  categoryFilter !== "all"
                  ? "Thử thay đổi từ khóa hoặc xóa bớt bộ lọc."
                  : "Tất cả sản phẩm trong kho đều còn hạn sử dụng an toàn."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fcf9f8] border-b border-[#f3ebe7]">
                      <th className="p-4 pl-6 text-xs font-semibold text-text-secondary uppercase w-16 text-center">
                        <input
                          type="checkbox"
                          checked={
                            currentItems.length > 0 &&
                            selectedIds.length === currentItems.length
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                        />

                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase w-20">
                        Ảnh
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        Tên sản phẩm
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        Danh mục
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">
                        Số lượng
                      </th>
                      <th className="p-4 pr-6 text-xs font-semibold text-text-secondary uppercase text-right">
                        Ngày hết hạn
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ebe7] text-sm">
                    {/* Render mảng currentItems thay vì toàn bộ filteredItems */}
                    {currentItems.map((item) => (
                      <tr
                        key={item.product_id}
                        className={`group transition-colors border-l-4 ${item.level === "severe"
                          ? "bg-red-50/50 hover:bg-red-50 border-l-red-500"
                          : item.level === "warning"
                            ? "bg-orange-50/50 hover:bg-orange-50 border-l-orange-400"
                            : "hover:bg-gray-50 border-l-transparent hover:border-l-primary/30"
                          }`}
                      >
                        <td className="p-4 pl-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.product_id)}
                            onChange={() => toggleSelect(item.product_id)}
                            className={`rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4 transition-opacity ${selectedIds.includes(item.product_id)
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                              }`}
                          />

                        </td>
                        <td className="p-4">
                          <div
                            className="h-12 w-12 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200 relative"
                            style={{
                              backgroundImage: `url(${item.image_url})`,
                            }}
                          >
                            {item.hasDiscount && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -50%
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-base">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium border-none shadow-none hover:bg-blue-100">
                            {getCategoryName(item.category_id)}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                        <span className="text-xl font-bold text-text-primary">
                          {item.stock_quantity}
                        </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div
                            className={`flex items-center justify-end gap-2 font-bold ${item.level === "severe" ? "text-red-600" : item.level === "warning" ? "text-orange-600" : "text-text-primary"}`}
                          >
                            {item.level === "severe" ? (
                              <CalendarX className="h-5 w-5" />
                            ) : item.level === "warning" ? (
                              <Clock className="h-5 w-5" />
                            ) : null}
                            {item.expiryFormatted}
                            <span
                              className={`ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.level === "severe"
                                ? "bg-red-100 text-red-700 animate-pulse"
                                : item.level === "warning"
                                  ? "bg-orange-100 text-orange-700"
                                  : item.level === "notice"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                            >
                              {item.daysLeft < 0
                                ? `Quá hạn ${Math.abs(item.daysLeft)} ngày`
                                : `Còn ${item.daysLeft} ngày`}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- CHÂN TRANG: PHÂN TRANG --- */}
              <div className="p-4 border-t border-[#f3ebe7] flex items-center justify-between bg-gray-50/50">
                <p className="text-sm text-text-secondary">
                  Hiển thị{" "}
                  <span className="font-bold text-text-primary">
                    {currentItems.length}
                  </span>{" "}
                  sản phẩm trong{" "}
                  <span className="font-bold text-text-primary">
                    {totalItems}
                  </span>{" "}
                  sản phẩm cảnh báo
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 &&
                            pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${currentPage === pageNumber
                                ? "bg-primary text-white shadow-md shadow-primary/30"
                                : "text-text-secondary hover:bg-gray-100"
                                }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <span key={pageNumber} className="text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages),
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Stats (Auto-Calculated) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-red-800 font-medium">
                  Khẩn cấp (&lt;= 7 ngày)
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.severeCount} sản phẩm
                </p>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-orange-800 font-medium">
                  Sắp tới (8-30 ngày)
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.warningCount} sản phẩm
                </p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Tổng tồn kho rủi ro
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalRiskStock} đơn vị
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alert Dialog Bulk Delete */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Xóa hàng loạt"
        description={`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm này vĩnh viễn? Hành động này không thể hoàn tác.`}
        actionLabel="Xóa sản phẩm"
        cancelLabel="Đóng"
        onConfirm={handleBulkDelete}
        variant="destructive"
      />
    </div >
  );
}
