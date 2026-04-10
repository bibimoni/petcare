import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  Package,
  Loader2,
  CalendarX,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getProductAlerts,
  getProductCategories,
  getInventoryTotalValue,
  getProductsByCategoryId,
} from "@/features/inventory/api/products.api";

type ProductLike = {
  expiry_date?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  category_id?: number | string;
};

export function InventoryStats() {
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const [alertsData, totalValue, categories] = await Promise.all([
        getProductAlerts(),
        getInventoryTotalValue(),
        getProductCategories(),
      ]);

      const lowStockCount = alertsData.filter((product) => {
        const stock = Number(product.stock_quantity || 0);
        const minStock = Number(product.min_stock_level || 0);
        return stock < 3 || stock <= minStock;
      }).length;

      const expiringCount = alertsData.filter((product) => {
        if (!product.expiry_date) return false;
        const expDate = new Date(product.expiry_date);
        const daysLeft =
          (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return daysLeft <= 30;
      }).length;

      const productResponses = await Promise.all(
        categories.map((category) =>
          getProductsByCategoryId(category.category_id),
        ),
      );

      const totalProducts = productResponses
        .flat()
        .reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0);

      return {
        totalProducts,
        lowStockCount,
        expiringCount,
        totalValue,
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  const stats = statsQuery.data ?? {
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    totalValue: 0,
  };
  const isLoading = statsQuery.isPending;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* 1. Tổng sản phẩm */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#f3ebe7] flex flex-col justify-between h-40 group hover:shadow-md transition-all relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-text-secondary font-medium mb-1">
              Tổng sản phẩm
            </p>
            <h3 className="text-4xl font-bold text-text-primary">
              {isLoading ? (
                <Loader2 className="animate-spin h-8 w-8 mt-1" />
              ) : (
                stats.totalProducts.toLocaleString("vi-VN")
              )}
            </h3>
          </div>
          <div className="text-blue-500 bg-blue-100 p-2 rounded-lg">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* 2. Sắp hết hàng */}
      <div
        onClick={() => navigate("/inventory/low-stock")}
        className="bg-[#fff9c4]/40 p-6 rounded-2xl shadow-sm border border-yellow-200 flex flex-col justify-between h-40 relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-yellow-800 font-medium mb-1">Sắp hết hàng</p>
            <h3 className="text-4xl font-bold text-yellow-900">
              {isLoading ? (
                <Loader2 className="animate-spin h-8 w-8 mt-1" />
              ) : (
                stats.lowStockCount
              )}
            </h3>
          </div>
          <div className="text-yellow-700 bg-yellow-200/60 p-2 rounded-lg animate-pulse">
            <AlertTriangle size={24} />
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-yellow-900 hover:underline flex items-center gap-1"
        >
          Xem danh sách <ArrowRight size={12} />
        </button>
      </div>

      {/* 3. Sắp hết HSD */}
      <div
        onClick={() => navigate("/inventory/expiring-soon")}
        className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-200 flex flex-col justify-between h-40 relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-orange-800 font-medium mb-1">Sắp hết HSD</p>
            <h3 className="text-4xl font-bold text-orange-900">
              {isLoading ? (
                <Loader2 className="animate-spin h-8 w-8 mt-1" />
              ) : (
                stats.expiringCount
              )}
            </h3>
          </div>
          <div className="text-orange-600 bg-orange-200/60 p-2 rounded-lg">
            <CalendarX size={24} />
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-orange-900 hover:underline flex items-center gap-1"
        >
          Xem danh sách <ArrowRight size={12} />
        </button>
      </div>

      {/* 4. Giá trị kho */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#f3ebe7] flex flex-col justify-between h-40">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-text-secondary font-medium mb-1">Giá trị kho</p>
            <h3 className="text-3xl font-bold text-text-primary">
              {isLoading ? (
                <Loader2 className="animate-spin h-8 w-8 mt-1" />
              ) : (
                <>
                  {stats.totalValue.toLocaleString("vi-VN")}
                  <span className="text-lg text-text-secondary font-normal ml-1">
                    đ
                  </span>
                </>
              )}
            </h3>
          </div>
          <div className="text-green-500 bg-green-100 p-2 rounded-lg">
            <Coins size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
