import { Package } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { AddProductModal } from "./add-product-modal";

export function InventoryHeader() {
  return (
    <div className="flex flex-col gap-4">
      {/* Phần đường dẫn Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Quản lý kho hàng</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Phần Tiêu đề và Nút hành động */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-orange-100 p-2 text-orange-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Danh mục hàng hóa
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý thú cưng, vật dụng và sản phẩm tại cửa hàng
            </p>
          </div>
        </div>

        <AddProductModal />
      </div>
    </div>
  );
}
