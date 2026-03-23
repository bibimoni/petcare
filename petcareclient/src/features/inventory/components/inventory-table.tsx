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
import {
  Edit3,
  AlertTriangle,
  Loader2,
  PackageSearch,
  ChevronLeft, 
  ChevronRight, 
} from "lucide-react";
import api from "@/lib/api";

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

  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; 

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let fetchedData: any[] = [];

        if (categoryId === "all") {
          const catRes = await api.get("/categories");
          const categories = catRes.data;

          const requests = categories.map((cat: any) =>
            api.get(`/products/category/${cat.category_id}`),
          );
          const responses = await Promise.all(requests);

          fetchedData = responses.flatMap((res) => res.data);
        } else {
          const res = await api.get(`/products/category/${categoryId}`);
          fetchedData = res.data;
        }

        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          fetchedData = fetchedData.filter(
            (p: any) =>
              p.name.toLowerCase().includes(lowerTerm) ||
              (p.sku && p.sku.toLowerCase().includes(lowerTerm)),
          );
        }

        setProducts(fetchedData);
        setCurrentPage(1); // Reset về trang 1 mỗi khi lọc/tìm kiếm lại
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchTerm]);

  const getStatus = (stock: number, minStock: number) => {
    if (stock === 0) return "Hết hàng";
    if (stock <= (minStock || 3)) return "Sắp hết";
    return "Còn hàng";
  };

  //  PHÂN TRANG 
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
          {/* Phần Bảng Dữ Liệu */}
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
                {/* Lặp qua mảng currentItems thay vì products */}
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

          {/* Phần Footer Phân Trang */}
          <div className="p-4 border-t border-[#f3ebe7] flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-text-secondary">
              Hiển thị{" "}
              <span className="font-bold text-text-primary">
                {currentItems.length}
              </span>{" "}
              trong{" "}
              <span className="font-bold text-text-primary">{totalItems}</span>{" "}
              sản phẩm
            </p>

            {/* Cụm Nút Chuyển Trang */}
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

                {/* Hiển thị số trang */}
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
    </div>
  );
}
