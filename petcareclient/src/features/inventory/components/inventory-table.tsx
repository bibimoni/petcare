import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, AlertTriangle, Loader2, PackageSearch } from "lucide-react";
import api from "@/lib/api"; // Đảm bảo import axios/api client của bạn

// 1. Nhận dữ liệu Filter từ Toolbar truyền xuống
interface InventoryTableProps {
  categoryId?: string;
  searchTerm?: string;
}

export function InventoryTable({
  categoryId = "all",
  searchTerm = "",
}: InventoryTableProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Tự động gọi API mỗi khi Category hoặc SearchTerm thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let fetchedData: any[] = [];

        if (categoryId === "all") {
          // MẸO (Workaround): Lấy tất cả danh mục trước, sau đó lấy sản phẩm của từng danh mục
          const catRes = await api.get("/v1/categories");
          const categories = catRes.data;

          const requests = categories.map((cat: any) =>
            api.get(`/v1/products/category/${cat.category_id}`),
          );
          const responses = await Promise.all(requests);

          // Gộp các mảng con thành 1 danh sách sản phẩm duy nhất
          fetchedData = responses.flatMap((res) => res.data);
        } else {
          // Chỉ lấy sản phẩm của 1 danh mục cụ thể
          const res = await api.get(`/v1/products/category/${categoryId}`);
          fetchedData = res.data;
        }

        // 3. Xử lý Lọc Tìm Kiếm (Bằng tên hoặc SKU) ở phía Client
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          fetchedData = fetchedData.filter(
            (p: any) =>
              p.name.toLowerCase().includes(lowerTerm) ||
              (p.sku && p.sku.toLowerCase().includes(lowerTerm)),
          );
        }

        setProducts(fetchedData);
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchTerm]);

  // Hàm tự động tính toán Trạng thái Tồn kho
  const getStatus = (stock: number, minStock: number) => {
    if (stock === 0) return "Hết hàng";
    if (stock <= (minStock || 3)) return "Sắp hết";
    return "Còn hàng";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden min-h-[400px]">
      {isLoading ? (
        // Giao diện khi đang tải
        <div className="flex flex-col items-center justify-center h-[400px] text-primary">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="font-medium">Đang tải danh sách kho hàng...</p>
        </div>
      ) : products.length === 0 ? (
        // Giao diện khi không tìm thấy sản phẩm
        <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
          <PackageSearch className="h-12 w-12 text-gray-300 mb-4" />
          <p className="font-medium text-lg text-text-primary">
            Không tìm thấy sản phẩm
          </p>
          <p className="text-sm">Thử thay đổi từ khóa hoặc bộ lọc danh mục.</p>
        </div>
      ) : (
        // Bảng dữ liệu thật
        <div className="overflow-x-auto">
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
              {products.map((product) => {
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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">
                            {product.name}
                          </span>
                          {status === "Sắp hết" && (
                            <AlertTriangle className="text-yellow-500 h-4 w-4" />
                          )}
                        </div>
                        <span className="text-xs text-text-secondary uppercase">
                          SKU: {product.sku || "N/A"}
                        </span>
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
                      <button className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary/10">
                        <Edit3 size={18} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
