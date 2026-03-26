import { useState } from "react";
import { InventoryStats } from "../components/inventory-stats";
import { InventoryTable } from "../components/inventory-table";
import { InventoryToolbar } from "../components/inventory-toolbar";

export default function InventoryPage() {
  // Tạo 2 state làm cầu nối liên lạc giữa Toolbar và Table
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  return (
    <div className="flex min-h-screen flex-col bg-background-light">
      <main className="flex-1 p-8 overflow-y-auto">
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
