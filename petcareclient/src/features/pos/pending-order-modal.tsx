import {
  Ban,
  Clock,
  Phone,
  MapPin,
  Package,
  X as Close,
  Dog as Pets,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface OrderDetail {
  id: number;
  code?: string;
  price: number;
  quantity: number;
  product_name?: string;
}

interface Order {
  id: number;
  code: string;
  pet_age?: string;
  pet_name?: string;
  pet_type?: string;
  pet_breed?: string;
  pet_weight?: string;
  pet_gender?: string;
  total_amount: number;
  customer_name: string;
  customer_type: string;
  details: OrderDetail[];
  customer_phone?: string;
  customer_address?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

interface PendingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onStatusChange: () => void;
}

// --- DỮ LIỆU MẪU (MOCK DATA) ---
const MOCK_PENDING_ORDER: Order = {
  id: 920,
  code: "POS-0920",
  status: "PENDING",
  customer_name: "Khách lẻ",
  customer_type: "Vãng lai",
  customer_phone: "",
  customer_address: "",
  pet_name: "Mimi",
  pet_type: "Thú cưng",
  pet_breed: "Mèo Anh",
  pet_weight: "3.5",
  pet_gender: "Cái",
  pet_age: "1.5 Tuổi",
  total_amount: 350000,
  details: [
    {
      id: 1,
      product_name: "Thức ăn hạt Royal Canin",
      code: "RC-KD-500",
      quantity: 1,
      price: 350000,
    },
  ],
};

export const PendingOrderModal = ({
  orderId,
  isOpen,
  onClose,
  onStatusChange,
}: PendingOrderModalProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Dùng chung cho cả nút Thanh toán và Hủy

  // Tải chi tiết đơn hàng (Giả lập API)
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      // Giả lập thời gian chờ tải data từ Server
      await new Promise((resolve) => setTimeout(resolve, 500));
      setOrder({ ...MOCK_PENDING_ORDER });
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId, isOpen]);

  // Xử lý Hoàn tất thanh toán
  const handleCompletePayment = async () => {
    setIsProcessing(true);
    // TODO: Thay bằng API thật (VD: api.patch(`/orders/${order?.id}/complete`))
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Thanh toán thành công!");
    setIsProcessing(false);
    onStatusChange(); // Tải lại danh sách bên ngoài
    onClose(); // Đóng modal
  };

  // Xử lý Hủy giao dịch nhanh
  const handleCancelOrder = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    setIsProcessing(true);
    // TODO: Thay bằng API thật (VD: api.patch(`/orders/${order?.id}/cancel`))
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Đã hủy đơn hàng!");
    setIsProcessing(false);
    onStatusChange(); // Tải lại danh sách bên ngoài
    onClose(); // Đóng modal
  };

  if (!isOpen || !order) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity"
        onClick={!isProcessing ? onClose : undefined}
      >
        {/* Modal Container */}
        <div
          className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()} // Chặn click overlay
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#f3ebe7] flex items-center justify-between shrink-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1b110d] font-['Plus_Jakarta_Sans']">
                  Chi tiết đơn hàng #{order.code}
                </h2>
                <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100 uppercase inline-block mt-0.5">
                  Chờ thanh toán
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="size-8 rounded-lg hover:bg-[#fcf9f8] flex items-center justify-center text-[#9a624c] transition-colors disabled:opacity-50"
            >
              <Close className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#fcf9f8]/50 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-4 justify-center items-center h-full text-[#9a624c]">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium text-sm">
                  Đang tải chi tiết đơn hàng...
                </p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
                {/* Cột trái (Thông tin) */}
                <div className="flex flex-col gap-4 w-full md:w-1/3">
                  {/* Khách hàng */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f3ebe7] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#f7b297]/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#f7b297]/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold border border-orange-200 shrink-0">
                          {order.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1b110d]">
                            {order.customer_name}
                          </div>
                          <div className="text-[10px] text-[#9a624c] uppercase tracking-wider font-semibold">
                            Khách hàng
                          </div>
                        </div>
                      </div>
                      <span className="bg-gray-100 text-[#9a624c] text-xs px-2 py-1 rounded-md font-medium">
                        {order.customer_type}
                      </span>
                    </div>
                    <div className="space-y-2 relative z-10 pl-13">
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <Phone className="w-4 h-4" />
                        <span>{order.customer_phone || "--"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <MapPin className="w-4 h-4" />
                        <span
                          className={
                            !order.customer_address
                              ? "italic text-gray-400"
                              : ""
                          }
                        >
                          {order.customer_address || "Chưa cập nhật địa chỉ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thú cưng */}
                  {order.pet_name && (
                    <div className="bg-white p-5 rounded-2xl border border-[#f3ebe7] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-blue-100/50 transition-colors"></div>
                      <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-[#fcf9f8] border border-[#f3ebe7] flex items-center justify-center text-[#9a624c] shrink-0">
                            <Pets className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-[#1b110d]">
                              {order.pet_name}
                            </div>
                            <div className="text-[10px] text-[#9a624c] uppercase tracking-wider font-semibold">
                              {order.pet_type}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {order.pet_gender && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-1 rounded-md font-bold uppercase">
                              {order.pet_gender}
                            </span>
                          )}
                          {order.pet_age && (
                            <span className="bg-pink-50 text-pink-700 border border-pink-100 text-[10px] px-2 py-1 rounded-md font-bold uppercase">
                              {order.pet_age}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#1b110d] font-medium pl-1">
                        <span className="size-1.5 rounded-full bg-green-500"></span>
                        {order.pet_breed}{" "}
                        {order.pet_weight ? `- ${order.pet_weight}kg` : ""}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cột phải (Danh sách sản phẩm) */}
                <div className="flex flex-col gap-4 w-full md:w-2/3">
                  <div className="bg-white rounded-2xl border border-[#f3ebe7] shadow-[0_0_0_1px_rgba(243,235,231,1),0_2px_8px_rgba(27,17,13,0.04)] overflow-hidden h-full flex flex-col">
                    <div className="px-5 py-3 border-b border-[#f3ebe7] bg-gray-50/50 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-[#1b110d] text-sm flex items-center gap-2">
                        <ShoppingBag className="text-[#f7b297] w-[18px] h-[18px]" />
                        Danh sách sản phẩm
                      </h3>
                      <span className="text-xs font-medium bg-white border border-[#f3ebe7] text-[#9a624c] px-2 py-1 rounded-md shadow-sm">
                        {order.details.length} sản phẩm
                      </span>
                    </div>

                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#fcf9f8] text-[#9a624c] text-xs uppercase font-bold border-b border-[#f3ebe7] sticky top-0 z-10">
                          <tr>
                            <th className="px-5 py-3 w-[45%]">Tên sản phẩm</th>
                            <th className="px-5 py-3 text-center w-[15%]">
                              SL
                            </th>
                            <th className="px-5 py-3 text-right w-[20%]">
                              Đơn giá
                            </th>
                            <th className="px-5 py-3 text-right w-[20%]">
                              Thành tiền
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3ebe7]">
                          {order.details.map((detail) => (
                            <tr
                              key={detail.id}
                              className="hover:bg-[#fcf9f8]/30 transition-colors group"
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-[#f3ebe7] group-hover:border-[#f7b297]/30 transition-colors">
                                    <Package className="text-gray-400 w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-[#1b110d] text-sm">
                                      {detail.product_name}
                                    </div>
                                    <div className="text-[11px] text-[#9a624c]">
                                      {detail.code}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center font-medium">
                                {detail.quantity}
                              </td>
                              <td className="px-5 py-3 text-right text-[#9a624c]">
                                {Number(detail.price).toLocaleString("vi-VN")}đ
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-[#1b110d]">
                                {(
                                  Number(detail.price) * detail.quantity
                                ).toLocaleString("vi-VN")}
                                đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tổng kết tiền */}
                    <div className="px-5 py-4 bg-gray-50/50 border-t border-[#f3ebe7] flex flex-col gap-2 shrink-0 mt-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#9a624c]">
                          Tổng tiền hàng
                        </span>
                        <span className="text-sm font-medium text-[#1b110d]">
                          {Number(order.total_amount).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="border-t border-dashed border-[#f3ebe7] my-1"></div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1b110d]">
                          Tổng thanh toán
                        </span>
                        <span className="font-bold text-[#f7b297] text-xl">
                          {Number(order.total_amount).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {!isLoading && (
            <div className="p-6 border-t border-[#f3ebe7] bg-white shrink-0 z-10 flex flex-col md:flex-row gap-4 items-center">
              <button
                onClick={handleCancelOrder}
                disabled={isProcessing}
                className="w-full md:w-1/3 bg-white hover:bg-red-50 text-[#9a624c] hover:text-red-600 font-semibold py-3.5 px-6 rounded-xl border border-gray-200 hover:border-red-200 transition-all flex items-center justify-center gap-2 order-2 md:order-1 disabled:opacity-50"
              >
                <Ban className="w-5 h-5" />
                Hủy giao dịch
              </button>
              <button
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full md:w-2/3 bg-[#A8E6CF] hover:bg-[#8addb6] text-emerald-900 font-bold py-3.5 px-6 rounded-xl shadow-[0_0_20px_-5px_rgba(168,230,207,0.5)] hover:shadow-lg hover:shadow-[#A8E6CF]/30 transition-all flex items-center justify-center gap-2 group order-1 md:order-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-[22px] h-[22px] border-2 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" />
                )}
                <span className="text-base">
                  {isProcessing
                    ? "Đang xử lý..."
                    : `Hoàn tất thanh toán (${Number(order.total_amount).toLocaleString("vi-VN")}đ)`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
