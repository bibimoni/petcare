import {
  Tag,
  Clock,
  Search,
  Filter,
  Trash2,
  Percent,
  Package,
  Loader2,
  ArrowLeft,
  Megaphone,
  CalendarX,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import api from "@/lib/api";

interface ExpiringAlert {
  sku: string;
  name: string;
  product_id: number;
  expiry_date: string;
  stock_quantity: number;

  daysLeft: number;
  image_url: string;
  hasDiscount: boolean;
  // Custom fields cho UI
  expiryFormatted: string;
  level: "severe" | "warning" | "notice" | "normal";
}

export default function ExpiringSoonPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExpiringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    severeCount: 0,
    warningCount: 0,
    totalRiskStock: 0,
  });

  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/products/alerts");

        const now = new Date();

        // Lọc và Transform Dữ Liệu
        const formattedData: ExpiringAlert[] = response.data
          .filter((p: any) => p.expiry_date) // lấy những sản phẩm có ngày hết hạn
          .map((product: any) => {
            const expiryDate = new Date(product.expiry_date);

            // Tính số ngày còn lại
            const timeDiff = expiryDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

            // Xác định mức độ cảnh báo (level)
            let level: ExpiringAlert["level"] = "normal";
            if (daysLeft <= 7) level = "severe";
            else if (daysLeft <= 15) level = "warning";
            else if (daysLeft <= 30) level = "notice";

            return {
              ...product,
              daysLeft,
              level,
              expiryFormatted: expiryDate.toLocaleDateString("vi-VN"),
              image_url:
                product.image_url ||
                "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
              hasDiscount: false,
            };
          })
          .filter((p: ExpiringAlert) => p.daysLeft <= 30)
          .sort(
            (a: ExpiringAlert, b: ExpiringAlert) => a.daysLeft - b.daysLeft,
          ); // Sắp xếp ngày hết hạn tăng dần

        setItems(formattedData);

        // Tính toán số liệu cho Bottom Stats
        setStats({
          severeCount: formattedData.filter((p) => p.daysLeft <= 7).length,
          warningCount: formattedData.filter(
            (p) => p.daysLeft > 7 && p.daysLeft <= 30,
          ).length,
          totalRiskStock: formattedData.reduce(
            (acc, curr) => acc + Number(curr.stock_quantity),
            0,
          ),
        });
      } catch (error) {
        console.error("Lỗi khi tải danh sách sắp hết HSD:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpiringProducts();
  }, []);

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
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              Sản phẩm Sắp hết HSD
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full border border-orange-200">
                {items.length} sản phẩm
              </span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input
              className="w-full bg-white border-none pl-10 pr-4 py-3 rounded-xl shadow-sm ring-1 ring-[#f3ebe7] focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400 text-sm transition-all"
              placeholder="Tìm kiếm trong danh sách hết hạn..."
              type="text"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col gap-6 mx-auto max-w-7xl">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-[#f3ebe7] text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer hover:bg-gray-50 h-11">
                  <option>Tất cả thời gian</option>
                  <option>Hết hạn trong 7 ngày</option>
                  <option>Hết hạn trong 30 ngày</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-[#f3ebe7] text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer hover:bg-gray-50 h-11">
                  <option>Tất cả danh mục</option>
                  <option>Thức ăn</option>
                  <option>Thuốc</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 bg-red-50 font-bold text-sm hover:bg-red-100 transition-colors h-11">
                <Trash2 className="h-4 w-4" /> Hủy hàng hết hạn
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 font-bold text-sm transition-all transform hover:scale-105 active:scale-95 h-11">
                <Megaphone className="h-4 w-4" /> Tạo KM xả kho
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden min-h-[400px]">
            {isLoading ? (
              // Trạng thái Loading
              <div className="flex flex-col items-center justify-center h-[400px] text-primary">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p className="font-medium">Đang kiểm tra hạn sử dụng...</p>
              </div>
            ) : items.length === 0 ? (
              // Trạng thái Rỗng (Không có hàng sắp hết hạn)
              <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
                <CalendarX className="h-12 w-12 text-gray-300 mb-4" />
                <p className="font-medium text-lg text-text-primary">
                  Không có hàng sắp hết hạn
                </p>
                <p className="text-sm">
                  Tất cả sản phẩm trong kho đều còn hạn sử dụng an toàn.
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
                        Tên sản phẩm
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        SKU / Lô hàng
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">
                        Số lượng
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        Ngày hết hạn
                      </th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase">
                        Trạng thái
                      </th>
                      <th className="p-4 pr-6 text-xs font-semibold text-text-secondary uppercase text-right">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ebe7] text-sm">
                    {items.map((item) => (
                      <tr
                        key={item.product_id}
                        className={`group transition-colors border-l-4 ${
                          item.level === "severe"
                            ? "bg-red-50/50 hover:bg-red-50 border-l-red-500"
                            : item.level === "warning"
                              ? "bg-orange-50/50 hover:bg-orange-50 border-l-orange-400"
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
                            <span className="font-bold text-text-primary">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
                            {item.sku || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-text-primary">
                            {item.stock_quantity}
                          </span>
                        </td>
                        <td className="p-4">
                          <div
                            className={`flex items-center gap-2 font-bold ${item.level === "severe" ? "text-red-600" : item.level === "warning" ? "text-orange-600" : "text-text-primary"}`}
                          >
                            {item.level === "severe" ? (
                              <CalendarX className="h-5 w-5" />
                            ) : item.level === "warning" ? (
                              <Clock className="h-5 w-5" />
                            ) : null}
                            {item.expiryFormatted}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              item.level === "severe"
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
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {item.level === "severe" ? (
                            <button className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-primary/30 transition-colors flex items-center gap-1 ml-auto">
                              <Tag className="h-3 w-3" /> Giảm giá ngay
                            </button>
                          ) : item.level === "warning" ? (
                            <button className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto">
                              <Percent className="h-3 w-3" /> Tạo KM
                            </button>
                          ) : (
                            <button className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10 ml-auto block">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-4 border-t border-[#f3ebe7] flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Hiển thị{" "}
                <span className="font-bold text-text-primary">
                  {items.length}
                </span>{" "}
                trong{" "}
                <span className="font-bold text-text-primary">
                  {items.length}
                </span>{" "}
                sản phẩm cảnh báo
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-gray-50 disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-primary text-white font-bold text-sm shadow-md shadow-primary/30">
                  1
                </button>
                <button
                  className="p-2 rounded-lg border border-[#f3ebe7] text-text-secondary hover:bg-gray-50 disabled:opacity-50"
                  disabled
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Stats (Auto-Calculated) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
}
