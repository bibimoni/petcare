import { useState } from "react";

import { Sidebar } from "@/components/Sidebar";
import { sidebarUser } from "@/lib/user";

import { InventoryStats } from "./components/inventory-stats";
import { InventoryTable } from "./components/inventory-table";
import { InventoryToolbar } from "./components/inventory-toolbar";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header của trang quản lý kho */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary">
              Quản lý Kho hàng
            </h1>
            <p className="text-text-secondary mt-1">
              Theo dõi tồn kho, hạn sử dụng và nhập hàng hóa
            </p>
          </div>

          {/* Các thẻ thống kê tổng quan */}
          <InventoryStats />

          {/* Thanh công cụ: Nhận sự kiện lọc và tìm kiếm */}
          <InventoryToolbar
            onSearch={setSearchTerm}
            onCategoryChange={setCategoryId}
          />

          {/* Bảng dữ liệu: Nhận giá trị lọc để tự động gọi API */}
          <InventoryTable searchTerm={searchTerm} categoryId={categoryId} />
        </div>
      </main>
    </div>
  );
}
