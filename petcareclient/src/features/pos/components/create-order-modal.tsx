import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Save,
  Trash2,
  Search,
  Package,
  UserPlus,
  PawPrint,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CustomerApi } from "@/features/customer/api/customer-api";
import AddCustomerModal from "@/features/customer/components/add-customer-modal";
import { createOrder } from "@/features/pos/api";
import { PetService } from "@/lib/pets";

import type { OrderItem } from "../pos-page";

interface CreateOrderModalProps {
  isOpen: boolean;
  userName: string;
  items: OrderItem[];
  onClose: () => void;
  onRemoveItem: (cartKey: string) => void;
  onUpdateQuantity: (
    cartKey: string,
    delta: number,
    type: "service" | "product",
  ) => void;
}

export const CreateOrderModal = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  userName,
}: CreateOrderModalProps) => {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: CustomerApi.getCustomers,
  });

  const { data: pets = [] } = useQuery({
    queryKey: ["customer-pets", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const res = await PetService.getByCustomer(Number(selectedCustomerId));
      return (Array.isArray(res) ? res : res?.data || []) as Record<
        string,
        any
      >[];
    },
    enabled: !!selectedCustomerId,
  });

  const handleAddCustomerSuccess = async () => {
    // Refetch customers list to include the newly created customer
    await queryClient.refetchQueries({
      queryKey: ["customers"],
    });
    setIsAddCustomerModalOpen(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const term = customerSearchTerm.toLowerCase();
    return (
      (c.fullName || c.full_name || "").toLowerCase().includes(term) ||
      (c.phone || "").includes(term)
    );
  });

  const subTotal = items.reduce(
    (sum, item) => sum + item.numericPrice * item.quantity,
    0,
  );

  const total = subTotal;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const hasServices = items.some((item) => item.type === "service");

  // Validation constraints
  const isCustomerValid = !!selectedCustomerId;
  const isPetValid = !hasServices || !!selectedPetId;
  const isCartNotEmpty = items.length > 0;
  const canSubmit = isCustomerValid && isPetValid && isCartNotEmpty;

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleCheckout = async () => {
    if (!canSubmit) return;

    const payload = {
      customer_id: Number(selectedCustomerId),
      items: items.map((it) => ({
        item_id: Number(it.id),
        item_type: it.type === "product" ? "PRODUCT" : "SERVICE",
        quantity: it.quantity,
        pet_id: selectedPetId ? Number(selectedPetId) : null,
      })),
      currency: "vnd",
    };

    try {
      setIsCreatingOrder(true);
      const res = await createOrder(payload);
      const checkoutUrl =
        res?.data?.checkout_url ?? res?.data?.data?.checkout_url;

      if (!checkoutUrl) {
        toast.error("Không nhận được đường dẫn thanh toán");
        return;
      }

      // redirect user to checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Create order failed:", err);
      toast.error("Tạo đơn hàng thất bại, vui lòng thử lại");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSaveOrder = async () => {
    if (!canSubmit) return;

    const payload = {
      customer_id: Number(selectedCustomerId),
      items: items.map((it) => ({
        item_id: Number(it.id),
        item_type: it.type === "product" ? "PRODUCT" : "SERVICE",
        quantity: it.quantity,
        pet_id: selectedPetId ? Number(selectedPetId) : null,
      })),
      currency: "vnd",
    };

    try {
      setIsSavingOrder(true);
      await createOrder(payload);
      toast.success("Đã lưu đơn hàng ở trạng thái tạm");
      onClose();
    } catch (_err) {
      // global error
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <>
      {/* Non-blocking background overlay just for visual transition (optional, removed to allow clicks) */}
      <div
        className={`fixed right-0 top-0 z-40 h-full w-[400px] flex flex-col border-l border-[#f0e3dc] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between border-b border-[#f0e3dc] px-6 py-4">
          <h2 className="text-xl font-extrabold text-[#2f231d]">Hóa đơn</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#9f7d67] hover:bg-[#f8f1ec] hover:text-[#2f231d] transition"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#9f7d67]">
              Khách hàng
            </label>
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#be9477] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nhập tên hoặc số điện thoại..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setIsCustomerDropdownOpen(true);
                    if (selectedCustomerId) {
                      setSelectedCustomerId("");
                      setSelectedPetId("");
                    }
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsCustomerDropdownOpen(false), 200)
                  }
                  className={`w-full rounded-xl border bg-[#fdfaf8] py-2.5 pl-10 pr-10 text-sm outline-none transition focus:ring-2 ${!isCustomerValid && customerSearchTerm === ""
                      ? "border-[#ecdcd1] focus:border-[#dcae8c] focus:ring-[#f3d8c4]"
                      : !isCustomerValid
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-[#ecdcd1] focus:border-[#dcae8c] focus:ring-[#f3d8c4]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-[#be9477] hover:text-[#2f231d]"
                >
                  <UserPlus className="w-5 h-5" />
                </button>

                {isCustomerDropdownOpen && customerSearchTerm && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#ecdcd1] bg-white shadow-lg">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.customer_id as string}
                          onClick={() => {
                            setSelectedCustomerId(c.customer_id as string);
                            setCustomerSearchTerm(
                              c.fullName || c.full_name || "",
                            );
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="cursor-pointer px-4 py-3 hover:bg-[#f8f1ec] border-b border-[#f0e3dc] last:border-0"
                        >
                          <div className="font-bold text-[#2f231d]">
                            {c.fullName || c.full_name}
                          </div>
                          <div className="text-xs text-[#9f7d67]">
                            {c.phone || "Không có SĐT"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-[#9f7d67]">
                        Không tìm thấy khách hàng
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!isCustomerValid && (
                <p className="px-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                  * Vui lòng chọn khách hàng
                </p>
              )}
            </div>
          </div>

          {/* Pet Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#9f7d67]">
              Chọn Pet {hasServices && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-1">
              <div className="relative">
                <div className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#efe5df] text-[#8d6955]">
                  <PawPrint className="w-[18px] h-[18px]" />
                </div>
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  disabled={!selectedCustomerId || pets.length === 0}
                  className={`w-full cursor-pointer appearance-none rounded-xl border bg-[#fdfaf8] py-2.5 pl-12 pr-10 text-sm font-medium outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${!isPetValid
                      ? "border-red-300 text-red-900 focus:border-red-400 focus:ring-red-100"
                      : "border-[#ecdcd1] text-[#523c30] focus:border-[#dcae8c] focus:ring-[#f3d8c4]"
                    }`}
                >
                  <option value="">
                    {!selectedCustomerId
                      ? "Vui lòng chọn khách hàng trước"
                      : pets.length === 0
                        ? "Khách hàng này chưa có pet"
                        : hasServices
                          ? "Chọn thú cưng (bắt buộc)"
                          : "Chọn thú cưng (tùy chọn)"}
                  </option>
                  {pets.map((p) => (
                    <option key={p.pet_id || p.id} value={p.pet_id || p.id}>
                      {p.name || p.pet_name} - {p.breed || p.species || "Khác"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#be9477] w-5 h-5" />
              </div>
              {!isPetValid && (
                <p className="px-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                  * Đơn hàng có dịch vụ, vui lòng chọn pet
                </p>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 pt-2">
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9f7d67]">
                Chưa có sản phẩm/dịch vụ nào được chọn
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex gap-4 rounded-xl border border-[#f0e3dc] p-3 shadow-sm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#dcae8c] text-white">
                    {item.type === "service" ? (
                      <Sparkles className="w-6 h-6" />
                    ) : (
                      <Package className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="line-clamp-1 text-sm font-bold text-[#2f231d]">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#9f7d67]">NV: {userName}</p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.cartKey)}
                        className="text-[#be9477] cursor-pointer hover:text-red-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-[#ecdcd1] bg-[#fdfaf8]">
                        <button
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#8d6955] hover:bg-[#efe5df] transition"
                          onClick={() =>
                            onUpdateQuantity(item.cartKey, -1, item.type)
                          }
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#2f231d]">
                          {item.quantity}
                        </span>
                        <button
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#8d6955] hover:bg-[#efe5df] transition"
                          onClick={() =>
                            onUpdateQuantity(item.cartKey, 1, item.type)
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-[#2f231d]">
                        {formatPrice(item.numericPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0e3dc] bg-[#faf7f5] p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#523c30]">
              <span>
                Tạm tính ({items.reduce((sum, i) => sum + i.quantity, 0)} món)
              </span>
              <span className="font-medium">{formatPrice(subTotal)}</span>
            </div>
          </div>

          <div className="flex justify-between items-end pt-2 border-t border-[#eaded6]">
            <span className="text-base font-bold text-[#2f231d]">
              Tổng tiền
            </span>
            <span className="text-2xl font-black text-[#f27a4d]">
              {formatPrice(total)}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSavingOrder || !canSubmit}
              className="flex h-14 w-14 cursor-pointer shrink-0 items-center justify-center rounded-xl border-2 border-[#ecdcd1] bg-white text-[#8d6955] hover:bg-[#fdfaf8] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCreatingOrder || !canSubmit}
              className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#a9e4d1] text-lg font-bold text-[#1f5a4b] hover:bg-[#97dcc6] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm disabled:shadow-none"
            >
              {isCreatingOrder ? "Đang tạo đơn..." : "Thanh toán"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AddCustomerModal
        open={isAddCustomerModalOpen}
        onOpenChange={setIsAddCustomerModalOpen}
        onCreated={handleAddCustomerSuccess}
      />
    </>
  );
};
