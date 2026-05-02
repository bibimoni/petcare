import { useQuery } from "@tanstack/react-query";
import {
  X,
  Plus,
  Check,
  Trash2,
  Package,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getProductCategories } from "@/features/inventory/api/products.api";
import api from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface Batch {
  id: string;
  quantity: string;
  expiryDate: string;
}

const extractCategoryId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const responseObject = payload as Record<string, unknown>;
  const categoryId = Number(responseObject.category_id ?? responseObject.id);

  if (Number.isFinite(categoryId)) {
    return categoryId;
  }

  if (responseObject.data && typeof responseObject.data === "object") {
    const nestedData = responseObject.data as Record<string, unknown>;
    const nestedCategoryId = Number(nestedData.category_id ?? nestedData.id);
    if (Number.isFinite(nestedCategoryId)) {
      return nestedCategoryId;
    }
  }

  return null;
};

export function AddProductModal() {
  // --- STATES ---
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: getProductCategories,
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });

  const categories = (categoriesQuery.data ?? []) as any[];
  const isLoadingCategories = categoriesQuery.isPending;

  // Dữ liệu Form
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [batches, setBatches] = useState<Batch[]>([
    { id: crypto.randomUUID(), quantity: "", expiryDate: "" },
  ]);

  // States phụ phục vụ chức năng "Thêm danh mục khác"
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // const addBatch = () => {
  //   setBatches([
  //     ...batches,
  //     { id: crypto.randomUUID(), quantity: "", expiryDate: "" },
  //   ]);
  // };

  const removeBatch = (id: string) => {
    setBatches(batches.filter((batch) => batch.id !== id));
  };

  const updateBatch = (id: string, field: keyof Batch, value: string) => {
    setBatches(
      batches.map((batch) =>
        batch.id === id ? { ...batch, [field]: value } : batch,
      ),
    );
  };

  // Hàm xử lý khi chọn danh mục
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "other") {
      setIsOtherCategory(true);
      setCategoryId(""); // Xóa categoryId cũ
    } else {
      setIsOtherCategory(false);
      setCategoryId(val);
      setNewCategoryName(""); // Xóa text nhập category mới nếu đổi ý
    }
  };

  const handleSubmit = async () => {
    // 1. Validate Form cơ bản
    if (
      !name ||
      (!categoryId && !isOtherCategory) ||
      !costPrice ||
      !sellPrice
    ) {
      toast.error("Vui lòng điền đầy đủ các trường có dấu *");
      return;
    }

    if (isOtherCategory && !newCategoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục mới!");
      return;
    }

    if (Number(costPrice) >= Number(sellPrice)) {
      toast.error("Giá bán phải lớn hơn giá vốn!");
      return;
    }

    const totalQuantity = batches.reduce(
      (acc, batch) => acc + Number(batch.quantity || 0),
      0,
    );

    if (totalQuantity <= 0) {
      toast.error("Vui lòng nhập số lượng lô hàng hợp lệ!");
      return;
    }

    // 2. Xử lý Hạn sử dụng (Chống lỗi quá khứ & timezone)
    const validDates = batches.map((b) => b.expiryDate).filter(Boolean);
    let finalExpiryDate = null;

    if (validDates.length > 0) {
      const earliestDate = validDates.sort()[0];
      finalExpiryDate = new Date(`${earliestDate}T23:59:59Z`).toISOString();
    }

    setIsSubmitting(true);
    let finalCategoryId = Number(categoryId);

    try {
      // 3. Logic tạo Danh mục mới (Nếu chọn "Khác")
      if (isOtherCategory) {
        const catRes = await api.post("/categories", {
          name: newCategoryName.trim(),
          type: "PRODUCT",
        });

        const newCategoryId = extractCategoryId(catRes);
        if (!newCategoryId) {
          throw new Error("Không lấy được category_id sau khi tạo danh mục");
        }

        finalCategoryId = newCategoryId;
      }

      // 4. Lắp ráp Payload thông minh
      const payload: any = {
        name: name,
        category_id: finalCategoryId,
        cost_price: Number(costPrice),
        sell_price: Number(sellPrice),
        stock_quantity: totalQuantity,
        min_stock_level: 5,
      };

      if (finalExpiryDate) {
        payload.expiry_date = finalExpiryDate;
      }

      // 5. Gửi lên Backend
      await api.post("/products", payload);
      toast.success("Nhập kho thành công!");

      setName("");
      setCategoryId("");
      setCostPrice("");
      setSellPrice("");
      setBatches([{ id: crypto.randomUUID(), quantity: "", expiryDate: "" }]);
      setIsOtherCategory(false);
      setNewCategoryName("");
      setIsOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-products"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] }),
      ]);
    } catch (error: any) {
      console.error("Lỗi khi nhập kho:", error);

      // 6. Bắt và hiển thị lỗi chính xác từ Backend
      const errData = error.response?.data;
      let errorMsg =
        "Không thể nhập kho lúc này (Vui lòng kiểm tra F12/Console)";

      if (errData && errData.message) {
        if (Array.isArray(errData.message)) {
          errorMsg = errData.message[0];
        } else {
          errorMsg = errData.message;
        }
      }

      toast.error("Lỗi: " + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold rounded-xl h-11 px-5 transition-all transform hover:scale-105">
          <Plus className="mr-2 h-4 w-4" /> Nhập Kho
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 sm:max-w-2xl rounded-2xl overflow-hidden border-none shadow-2xl [&>button]:hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f3ebe7]">
          <h3 className="text-xl font-bold text-[#1b110d] flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-2 rounded-lg">
              <Package className="h-6 w-6" />
            </span>
            Nhập Kho Sản Phẩm Mới
          </h3>
          <DialogClose asChild>
            <button className="text-[#9a624c] hover:text-[#1b110d] transition-colors p-1 rounded-md hover:bg-[#fcf9f8]">
              <X className="h-6 w-6" />
            </button>
          </DialogClose>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Tên sản phẩm & Danh mục */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1b110d]">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hạt Royal Canin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d4c5c0] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm placeholder:text-[#d4c5c0] transition-all bg-[#fcf9f8]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1b110d]">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={isOtherCategory ? "other" : categoryId}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d4c5c0] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm bg-[#fcf9f8] appearance-none text-[#1b110d]"
                  >
                    <option value="" disabled>
                      Chọn danh mục
                    </option>
                    {isLoadingCategories ? (
                      <option disabled>Đang tải...</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                    {/* Tùy chọn Thêm Mới */}
                    <option value="other" className="font-bold text-primary">
                      + Khác (Thêm mới...)
                    </option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9a624c]">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </div>

                {/* Input hiện ra khi chọn "Khác" */}
                {isOtherCategory && (
                  <div className="mt-1 animate-in fade-in slide-in-from-top-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Nhập tên danh mục mới..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm transition-all bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết lô hàng (Dynamic List) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#1b110d]">
                  Chi tiết lô hàng <span className="text-red-500">*</span>
                </label>
                {/* <button
                  type="button"
                  onClick={addBatch}
                  className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" /> Thêm lô hàng
                </button> */}
              </div>

              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="grid grid-cols-12 gap-4 items-end bg-[#fcfaf8] p-3 rounded-xl border border-[#f3ebe7]"
                >
                  <div className="col-span-6 flex flex-col gap-2">
                    <label className="text-xs font-medium text-[#9a624c]">
                      Số lượng nhập
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={batch.quantity}
                      onChange={(e) =>
                        updateBatch(batch.id, "quantity", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d4c5c0] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm placeholder:text-[#d4c5c0] transition-all bg-white"
                    />
                  </div>
                  <div className="col-span-5 flex flex-col gap-2">
                    <label className="text-xs font-medium text-[#9a624c]">
                      Hạn sử dụng (HSD)
                    </label>
                    <input
                      type="date"
                      value={batch.expiryDate}
                      onChange={(e) =>
                        updateBatch(batch.id, "expiryDate", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d4c5c0] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm placeholder:text-[#d4c5c0] transition-all bg-white"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pb-2">
                    <button
                      type="button"
                      onClick={() => removeBatch(batch.id)}
                      disabled={batches.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-red-400 transition-colors"
                      title="Xóa lô hàng"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Giá vốn & Giá bán */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1b110d]">
                  Giá vốn (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 100000"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d4c5c0] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm placeholder:text-[#d4c5c0] transition-all bg-[#fcf9f8]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1b110d]">
                  Giá bán (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 150000"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d4c5c0] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm placeholder:text-[#d4c5c0] transition-all bg-[#fcf9f8]"
                />
              </div>
            </div>

            {/* Upload Hình Ảnh */}
            {/* <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1b110d]">
                Hình ảnh sản phẩm
              </label>
              <div className="w-full border-2 border-dashed border-[#d4c5c0] hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-[#fcf9f8] cursor-pointer transition-colors group">
                <div className="size-12 rounded-full bg-[#f3ebe7] group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <CloudUpload className="text-[#9a624c] group-hover:text-primary h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1b110d]">
                    Kéo thả hình ảnh vào đây hoặc{" "}
                    <span className="text-primary hover:underline">
                      tải lên
                    </span>
                  </p>
                  <p className="text-xs text-[#9a624c] mt-1">
                    Hỗ trợ: PNG, JPG, JPEG (Tối đa 5MB)
                  </p>
                </div>
              </div>
            </div> */}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f3ebe7] flex items-center justify-end gap-3 bg-[#fcfaf8]">
          <DialogClose asChild>
            <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#1b110d] bg-[#e5e7eb] hover:bg-[#d1d5db] transition-colors">
              Hủy bỏ
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            {isSubmitting ? "Đang xử lý..." : "Hoàn tất nhập kho"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
