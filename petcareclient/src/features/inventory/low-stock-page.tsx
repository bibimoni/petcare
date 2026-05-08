import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Trash2,
  Loader2,
  Package,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { getInventoryAlertsData } from "@/features/inventory/api/products.api";
import api from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface ProductAlert {
  sku?: string;
  name: string;
  product_id: number;
  sell_price: number;
  image_url?: string;
  category_id?: number;
  stock_quantity: number;
  min_stock_level: number;

  categoryColor?: string;
  level?: "severe" | "warning";
}

export default function LowStockPage() {
  const navigate = useNavigate();
  const alertsQuery = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: getInventoryAlertsData,
    staleTime: 2 * 60 * 1000,
  });

  const categories = alertsQuery.data?.categories ?? [];
  const isLoading = alertsQuery.isPending;

  // State quản lý tìm kiếm và phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ITEMS_PER_PAGE = 5;

  const items = useMemo(() => {
    const alerts = alertsQuery.data?.alerts ?? [];

    const formattedData = alerts.map((product) => {
      const stockQuantity = Number(product.stock_quantity ?? 0);
      const minStockLevel = Number(product.min_stock_level ?? 0);
      const isSevere = stockQuantity === 0;

      return {
        ...product,
        name: String(product.name ?? "Sản phẩm"),
        product_id: Number(product.product_id),
        sell_price: Number(product.sell_price ?? 0),
        category_id: product.category_id
          ? Number(product.category_id)
          : undefined,
        stock_quantity: stockQuantity,
        min_stock_level: minStockLevel,
        image_url:
          product.image_url ||
          "https://images.unsplash.com/photo-1583337130417-3346a1be7dee",
        level: isSevere ? "severe" : "warning",
        categoryColor: "bg-orange-50 text-orange-700 border-orange-100",
      } as ProductAlert;
    });

    return formattedData.filter(
      (product) =>
        product.stock_quantity < 3 ||
        product.stock_quantity <= (product.min_stock_level || 0),
    );
  }, [alertsQuery.data?.alerts]);

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredItems = items.filter((item) => {
    const lowerTerm = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(lowerTerm);
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Hàm tra cứu tên danh mục
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
      await Promise.all(selectedIds.map((id) => api.delete(`/products/${id}`)));
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
            className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-[#f3ebe7] text-text-primary hover:text-primary transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <span>Kho hàng</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary-dark">Cảnh báo tồn kho</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">
              Sản phẩm Sắp hết hàng
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
                Các sản phẩm dưới ngưỡng an toàn kho
              </p>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-100 shadow-sm animate-in fade-in slide-in-from-left-2"
              >
                <Trash2 size={18} />
                Xóa {selectedIds.length} đã chọn
              </button>
            )}
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-primary">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p className="font-medium">Đang tải dữ liệu kho...</p>
              </div>
            ) : totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <p className="font-medium text-lg text-text-primary">
                  {searchTerm
                    ? "Không tìm thấy sản phẩm phù hợp"
                    : "Kho hàng an toàn"}
                </p>
                <p className="text-sm">
                  {searchTerm
                    ? "Vui lòng thử lại với từ khóa khác."
                    : "Hiện tại không có sản phẩm nào sắp hết hàng."}
                </p>
              </div>
            ) : (
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
                        Tồn kho hiện tại
                      </th>
                      <th className="p-4 pr-6 text-xs font-semibold text-text-secondary uppercase text-right">
                        Giá bán
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ebe7] text-sm">
                    {currentItems.map((item) => (
                      <tr
                        key={item.product_id}
                        className={`group transition-colors border-l-4 ${
                          item.level === "severe"
                            ? "bg-red-50/50 hover:bg-red-50 border-l-red-400"
                            : "hover:bg-gray-50 border-l-transparent hover:border-l-primary/30"
                        }`}
                      >
                        <td className="p-4 pl-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.product_id)}
                            onChange={() => toggleSelect(item.product_id)}
                            className={`rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4 transition-opacity ${
                              selectedIds.includes(item.product_id)
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </td>
                        <td className="p-4">
                          <div
                            className="h-12 w-12 rounded-lg bg-white bg-cover bg-center border border-gray-200 shadow-sm"
                            style={{
                              backgroundImage: `url(${item.image_url})`,
                            }}
                          ></div>
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
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`text-xl font-bold ${item.level === "severe" ? "text-red-600" : "text-orange-500"}`}
                            >
                              {item.stock_quantity}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${item.level === "severe" ? "text-red-400" : "text-orange-400"}`}
                            >
                              Ngưỡng: {item.min_stock_level || 3}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right font-bold text-text-primary text-base">
                          {Number(item.sell_price).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalItems > 0 && (
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
                  sản phẩm
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
                              className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                                currentPage === pageNumber
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
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
}
