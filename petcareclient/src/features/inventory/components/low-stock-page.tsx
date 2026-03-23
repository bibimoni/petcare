import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Download,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from "lucide-react";
import api from "@/lib/api";

interface ProductAlert {
  product_id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  sell_price: number;
  image_url?: string;

  level?: "severe" | "warning";
  categoryColor?: string;
}

export default function LowStockPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ProductAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/products/alerts");

        const formattedData = response.data.map((product: any) => {
          const isSevere = product.stock_quantity === 0;

          return {
            ...product,
            image_url:
              product.image_url ||
              "https://images.unsplash.com/photo-1583337130417-3346a1be7dee",
            level: isSevere ? "severe" : "warning",
            categoryColor: "bg-orange-50 text-orange-700 border-orange-100",
          };
        });

        const lowStockItems = formattedData.filter(
          (p: any) =>
            p.stock_quantity < 3 ||
            p.stock_quantity <= (p.min_stock_level || 0),
        );

        setItems(lowStockItems);
      } catch (error) {
        console.error("Lỗi khi tải danh sách sắp hết hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockProducts();
  }, []);

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
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col gap-6 mx-auto max-w-7xl">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {items.length} sản phẩm cần nhập
              </span>
              <p className="text-text-secondary text-sm">
                Các sản phẩm dưới ngưỡng an toàn kho
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors bg-white">
                <Download className="h-4 w-4" /> Xuất Excel
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold text-sm transition-all transform hover:scale-105 active:scale-95">
                <ShoppingCart className="h-4 w-4" /> Tạo phiếu nhập hàng loạt
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden min-h-[400px]">
            {isLoading ? (
              // Trạng thái Loading
              <div className="flex flex-col items-center justify-center h-[400px] text-primary">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p className="font-medium">Đang tải dữ liệu kho...</p>
              </div>
            ) : items.length === 0 ? (
              // Trạng thái không có sản phẩm nào sắp hết
              <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <p className="font-medium text-lg text-text-primary">
                  Kho hàng an toàn
                </p>
                <p className="text-sm">
                  Hiện tại không có sản phẩm nào sắp hết hàng.
                </p>
              </div>
            ) : (
              // Bảng dữ liệu thật
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fcf9f8] border-b border-[#f3ebe7]">
                      <th className="p-4 pl-6 text-xs font-semibold text-text-secondary uppercase w-16 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase w-20">
                        Ảnh
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        Tên sản phẩm (SKU)
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        Danh mục
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">
                        Tồn kho hiện tại
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">
                        Giá bán
                      </th>
                      <th className="p-4 pr-6 text-xs font-semibold text-text-secondary uppercase text-center">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ebe7] text-sm">
                    {items.map((item) => (
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
                            className="rounded border-gray-300 text-primary focus:ring-primary opacity-0 group-hover:opacity-100 transition-opacity"
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
                            <span className="text-xs text-text-secondary font-mono mt-0.5">
                              SKU: {item.sku}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.categoryColor}`}
                          >
                            Hàng hóa
                          </span>
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
                        <td className="p-4 text-right font-bold text-text-primary text-base">
                          {Number(item.sell_price).toLocaleString()}đ
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <button className="bg-gradient-to-r from-orange-400 to-primary hover:from-orange-500 hover:to-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-orange-200 transition-all hover:shadow-lg transform active:scale-95 flex items-center justify-center gap-2 mx-auto w-32">
                            <ShoppingCart className="h-4 w-4" /> Nhập ngay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-4 border-t border-[#f3ebe7] flex items-center justify-between bg-gray-50/50">
              <p className="text-sm text-text-secondary">
                Hiển thị{" "}
                <span className="font-bold text-text-primary">
                  {items.length}
                </span>{" "}
                sản phẩm cần nhập hàng
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-white disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-primary text-white font-bold text-sm shadow-md shadow-primary/30">
                  1
                </button>
                <button
                  className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-white disabled:opacity-50"
                  disabled
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
