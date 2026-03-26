import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, ClipboardList, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddProductModal } from "./add-product-modal";
import api from "@/lib/api";

// 1. Định nghĩa Props để truyền thao tác lọc lên trang cha (InventoryPage)
interface InventoryToolbarProps {
  onSearch?: (searchTerm: string) => void;
  onCategoryChange?: (categoryId: string) => void;
}

export function InventoryToolbar({
  onSearch,
  onCategoryChange,
}: InventoryToolbarProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Gọi API lấy danh sách Danh mục thật từ Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/categories?type=PRODUCT");

        const data = res.data || res;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {/* Thanh tìm kiếm */}
        <div className="relative w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors" />
          <Input
            className="w-full bg-white border-none pl-10 pr-4 py-6 rounded-xl shadow-sm ring-1 ring-[#f3ebe7] focus:ring-2 focus:ring-primary placeholder:text-gray-400 text-sm"
            placeholder="Tìm kiếm sản phẩm,..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>

        {/* Dropdown danh mục */}
        <Select
          defaultValue="all"
          onValueChange={(value) => onCategoryChange && onCategoryChange(value)}
        >
          <SelectTrigger className="w-[180px] bg-white rounded-xl border-[#f3ebe7] text-text-primary h-11">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>

            {/* Render danh sách danh mục từ API */}
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              categories.map((cat) => (
                <SelectItem
                  key={cat.category_id}
                  value={cat.category_id.toString()}
                >
                  {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Nhóm nút hành động */}
      <div className="flex items-center gap-3">
        {/* <Button
          variant="outline"
          className="border-primary text-primary font-bold rounded-xl h-11 px-5 hover:bg-primary/5"
        >
          <ClipboardList className="mr-2 h-4 w-4" /> Kiểm Kho
        </Button> */}

        {/* Form thêm sản phẩm mới */}
        <AddProductModal />
      </div>
    </div>
  );
}
