import { useQuery } from "@tanstack/react-query";
import {
  X,
  Edit3,
  Camera,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  PackageSearch,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  getProductsForTable,
  getProductCategories,
} from "@/features/inventory/api/products.api";
import api from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface InventoryTableProps {
  categoryId?: string;
  searchTerm?: string;
}

export function InventoryTable({
  categoryId = "all",
  searchTerm = "",
}: InventoryTableProps) {
  const categoriesQuery = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: getProductCategories,
    staleTime: 10 * 60 * 1000,
  });
  const productsQuery = useQuery({
    queryKey: ["inventory-products", categoryId],
    queryFn: () => getProductsForTable(categoryId),
    staleTime: 2 * 60 * 1000,
  });

  const categories = (categoriesQuery.data ?? []) as any[];
  const isLoading = productsQuery.isPending;
  const products = useMemo(() => {
    let fetchedData = (productsQuery.data ?? []) as any[];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      fetchedData = fetchedData.filter((product: any) =>
        String(product.name || "")
          .toLowerCase()
          .includes(lowerTerm),
      );
    }

    return fetchedData;
  }, [productsQuery.data, searchTerm]);

  // --- STATES PHỤ CHO MODAL EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchTerm]);

  const getStatus = (stock: number, minStock: number) => {
    if (stock === 0) return "Hết hàng";
    if (stock <= (minStock || 3)) return "Sắp hết";
    return "Còn hàng";
  };

  //  HÀM MỞ MODAL VÀ ĐIỀN DỮ LIỆU
  const openEditModal = (product: any) => {
    let formattedDate = "";
    if (product.expiry_date) {
      formattedDate = new Date(product.expiry_date).toISOString().split("T")[0];
    }

    const formattedCostPrice = product.cost_price
      ? Number(product.cost_price).toString()
      : "";
    const formattedSellPrice = product.sell_price
      ? Number(product.sell_price).toString()
      : "";

    setEditingProduct({
      ...product,
      cost_price: formattedCostPrice,
      sell_price: formattedSellPrice,
      expiry_date: formattedDate,
    });
    setIsEditModalOpen(true);
  };

  //  HÀM CẬP NHẬT SẢN PHẨM
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payload: any = {
        name: editingProduct.name,
        category_id: Number(editingProduct.category_id),
        stock_quantity: Number(editingProduct.stock_quantity),
        cost_price: Number(editingProduct.cost_price),
        sell_price: Number(editingProduct.sell_price),
        image_url: editingProduct.image_url,
      };

      if (editingProduct.expiry_date) {
        payload.expiry_date = new Date(
          `${editingProduct.expiry_date}T23:59:59Z`,
        ).toISOString();
      }

      await api.patch(`/products/${editingProduct.product_id}`, payload);
      alert("Cập nhật sản phẩm thành công!");
      setIsEditModalOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-products"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] }),
      ]);
    } catch (error: any) {
      console.error(error);
      alert(
        "Lỗi cập nhật: " + (error.response?.data?.message || "Không xác định"),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  //  HÀM XÓA SẢN PHẨM
  const handleDeleteProduct = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này vĩnh viễn?"))
      return;
    setIsUpdating(true);
    try {
      await api.delete(`/products/${editingProduct.product_id}`);
      alert("Đã xóa sản phẩm!");
      setIsEditModalOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-products"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] }),
      ]);
    } catch (error: any) {
      alert(
        "Lỗi xóa sản phẩm: " +
          (error.response?.data?.message || "Không xác định"),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  //  HÀM ĐỔI ẢNH TẠM THỜI
  const handleChangeImage = () => {
    const url = window.prompt(
      "Vui lòng dán đường link (URL) hình ảnh vào đây:",
      editingProduct.image_url || "",
    );
    if (url) {
      setEditingProduct({ ...editingProduct, image_url: url });
    }
  };

  // Tính toán phân trang
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = products.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden min-h-[400px]">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-primary">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="font-medium">Đang tải danh sách kho hàng...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
          <PackageSearch className="h-12 w-12 text-gray-300 mb-4" />
          <p className="font-medium text-lg text-text-primary">
            Không tìm thấy sản phẩm
          </p>
          <p className="text-sm">Thử thay đổi từ khóa hoặc bộ lọc danh mục.</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Bảng Dữ Liệu */}
          <div className="overflow-x-auto flex-1">
            <Table className="w-full">
              <TableHeader className="bg-[#fcf9f8] border-b border-[#f3ebe7]">
                <TableRow>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase w-20">
                    Ảnh
                  </TableHead>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase">
                    Tên sản phẩm
                  </TableHead>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase">
                    Danh mục
                  </TableHead>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase">
                    Tồn kho
                  </TableHead>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">
                    Giá nhập
                  </TableHead>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">
                    Giá bán
                  </TableHead>
                  <TableHead className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm">
                {currentItems.map((product) => {
                  const status = getStatus(
                    product.stock_quantity,
                    product.min_stock_level,
                  );
                  return (
                    <TableRow
                      key={product.product_id}
                      className={`group hover:bg-gray-50 transition-colors ${
                        status === "Sắp hết"
                          ? "bg-[#fffde7]/60 border-l-4 border-l-yellow-400"
                          : status === "Hết hàng"
                            ? "bg-red-50/50 border-l-4 border-l-red-400"
                            : ""
                      }`}
                    >
                      <TableCell className="p-4">
                        <Avatar className="size-10 rounded-lg border border-gray-200">
                          <AvatarImage
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1583337130417-3346a1be7dee"
                            }
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {product.name?.[0] || "P"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="p-4">
                        {/* Đã xóa mã SKU ở đây */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">
                            {product.name}
                          </span>
                          {status === "Sắp hết" && (
                            <AlertTriangle className="text-yellow-500 h-4 w-4" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium border-none shadow-none hover:bg-blue-100">
                          Sản phẩm
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${status === "Hết hàng" ? "bg-red-500" : "bg-green-500"}`}
                              style={{
                                width: `${Math.min((product.stock_quantity / 50) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span
                            className={`font-bold ${status === "Hết hàng" || status === "Sắp hết" ? "text-red-500" : "text-text-primary"}`}
                          >
                            {product.stock_quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-right font-medium text-text-secondary italic">
                        {Number(product.cost_price || 0).toLocaleString()}đ
                      </TableCell>
                      <TableCell className="p-4 text-right font-bold text-text-primary">
                        {Number(product.sell_price || 0).toLocaleString()}đ
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary/10"
                        >
                          <Edit3 size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-[#f3ebe7] flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-text-secondary">
              Hiển thị{" "}
              <span className="font-bold text-text-primary">
                {currentItems.length}
              </span>{" "}
              sản phẩm trong{" "}
              <span className="font-bold text-text-primary">{totalItems}</span>{" "}
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
        </div>
      )}

      {/* --- MODAL CHỈNH SỬA / XÓA --- */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-[#f3ebe7]">
            <div className="px-8 py-6 border-b border-[#f3ebe7] flex justify-between items-center bg-[#fcf9f8]">
              <h2 className="text-xl font-bold tracking-tight text-[#1b110d]">
                Chỉnh sửa sản phẩm
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-text-secondary hover:text-[#1b110d] transition-colors p-2 hover:bg-[#f3ebe7] rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateProduct} className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Image Upload Section */}
                <div className="flex flex-col items-center gap-4 group">
                  <div className="relative">
                    <img
                      alt={editingProduct.name}
                      className="w-32 h-32 rounded-xl object-cover shadow-sm border-2 border-[#f3ebe7] group-hover:opacity-90 transition-opacity"
                      src={
                        editingProduct.image_url ||
                        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee"
                      }
                    />
                    <button
                      type="button"
                      onClick={handleChangeImage}
                      className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    Thay đổi hình ảnh
                  </span>
                </div>

                {/* Input Fields Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Product Name */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                      Tên sản phẩm
                    </label>
                    <input
                      required
                      className="w-full bg-[#fcf9f8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#1b110d] font-medium px-4 py-3 outline-none transition-all"
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                      Danh mục
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={editingProduct.category_id}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            category_id: e.target.value,
                          })
                        }
                        className="w-full appearance-none bg-[#fcf9f8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#1b110d] font-medium px-4 py-3 pr-10 outline-none transition-all"
                      >
                        <option value="" disabled>
                          Chọn danh mục
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary h-4 w-4 pointer-events-none" />
                    </div>
                  </div>

                  {/* Stock Level */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                      Số lượng tồn kho
                    </label>
                    <input
                      required
                      min="0"
                      className="w-full bg-[#fcf9f8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#1b110d] font-medium px-4 py-3 outline-none transition-all"
                      type="number"
                      value={editingProduct.stock_quantity}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stock_quantity: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                      Hạn sử dụng
                    </label>
                    <input
                      className="w-full bg-[#fcf9f8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#1b110d] font-medium px-4 py-3 outline-none transition-all"
                      type="date"
                      value={editingProduct.expiry_date}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          expiry_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                      Giá vốn
                    </label>
                    <div className="relative">
                      <input
                        required
                        className="w-full bg-[#fcf9f8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#1b110d] font-medium px-4 py-3 pr-10 outline-none transition-all"
                        type="number"
                        value={editingProduct.cost_price}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            cost_price: e.target.value,
                          })
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xs">
                        ₫
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                      Giá bán
                    </label>
                    <div className="relative">
                      <input
                        required
                        className="w-full bg-[#fcf9f8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#1b110d] font-bold px-4 py-3 pr-10 outline-none transition-all"
                        type="number"
                        value={editingProduct.sell_price}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            sell_price: e.target.value,
                          })
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xs">
                        ₫
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-[#f3ebe7]">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50"
                >
                  <Trash2 size={18} /> Xóa sản phẩm
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-[#1b110d] font-bold hover:bg-[#f3ebe7] transition-colors active:scale-95"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
