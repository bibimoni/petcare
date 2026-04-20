import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  X as Close,
  User as Person,
  Dog as Pets,
  AlertTriangle as Warning,
  Banknote as CurrencyExchange,
  ShoppingBag,
  Printer as Print,
} from "lucide-react";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface OrderDetail {
  id: number;
  product_name?: string;
  service_name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  code: string;
  status: "COMPLETED" | "CANCELLED" | "PENDING";
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  pet_name?: string;
  pet_breed?: string;
  pet_weight?: string;
  pet_gender?: string;
  total_amount: number;
  details: OrderDetail[];
}

interface OrderDetailModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}

// mock
const MOCK_ORDER: Order = {
  id: 922,
  code: "POS-0922",
  status: "COMPLETED",
  customer_name: "Nguyễn Văn A",
  customer_phone: "0987.654.321",
  customer_address: "Hà Nội, Việt Nam",
  pet_name: "Lu",
  pet_breed: "Chó Poodle",
  pet_weight: "5",
  pet_gender: "Đực",
  total_amount: 637200,
  details: [
    {
      id: 1,
      service_name: "Gói Spa Cắt Tỉa (Full)",
      quantity: 1,
      price: 450000,
    },
    {
      id: 2,
      product_name: "Pate Whiskas Vị Cá Biển 400g",
      quantity: 2,
      price: 93600,
    },
  ],
};

export const OrderDetailModal = ({
  orderId,
  isOpen,
  onClose,
  onStatusChange,
}: OrderDetailModalProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Tải chi tiết đơn hàng 
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      setOrder({ ...MOCK_ORDER });
      setCancelReason(""); // Xóa lý do cũ
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId, isOpen]);

  // Xử lý hủy đơn 
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy đơn");
      return;
    }

    setIsCanceling(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Hủy đơn & Hoàn tiền thành công");

    setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));

    setIsCanceling(false);

    onStatusChange();
  };

  if (!isOpen || !order) return null;

  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(0,0,0,0.05)] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="px-8 py-5 border-b border-[#f3ebe7] flex items-center justify-between bg-white shrink-0 h-20">
            <div className="flex items-center gap-4">
              {/* Icon Trạng thái */}
              <div
                className={`size-11 rounded-full flex items-center justify-center border shadow-sm ${
                  isCancelled
                    ? "bg-red-50 text-red-600 border-red-100"
                    : "bg-green-50 text-green-600 border-green-100"
                }`}
              >
                {isCancelled ? (
                  <Close className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#1b110d] leading-tight">
                  Chi tiết đơn hàng
                </h2>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-[#9a624c] font-medium">
                    Mã đơn:{" "}
                    <span className="text-[#1b110d] font-bold">
                      #{order.code}
                    </span>
                  </span>
                  <span className="text-gray-300">|</span>
                  {/* Badge Trạng thái */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                      isCancelled
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-green-50 text-green-700 border-green-100"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        isCancelled ? "bg-red-500" : "bg-green-500"
                      }`}
                    ></span>
                    {isCancelled ? "Đã Hủy" : "Hoàn thành"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#9a624c] hover:text-[#1b110d] hover:bg-[#fcf9f8] p-2 rounded-lg transition-colors"
            >
              <Close className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA] custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-4 justify-center items-center h-full text-[#9a624c]">
                <div className="w-8 h-8 border-4 border-[#f7b297] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium text-sm">
                  Đang tải chi tiết đơn hàng...
                </p>
              </div>
            ) : (
              <div className="flex gap-8 h-full flex-col lg:flex-row animate-in fade-in duration-300">
                {/* Cột trái: Thông tin Khách/Thú cưng & Form Hủy */}
                <div className="w-full lg:w-1/3 flex flex-col gap-5">
                  {/* Khách hàng */}
                  <div className="bg-white rounded-xl p-5 border border-[#f3ebe7] shadow-sm">
                    <h3 className="text-xs font-bold text-[#9a624c] uppercase mb-4 flex items-center gap-2">
                      <Person className="w-[18px] h-[18px]" />
                      Thông tin khách hàng
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-[#f7b297]/10 text-[#e09a80] flex items-center justify-center font-bold text-lg border border-[#f7b297]/20 shrink-0">
                        {order.customer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-[#1b110d] truncate text-base">
                          {order.customer_name}
                        </div>
                        <div className="text-sm text-[#9a624c] mt-0.5">
                          {order.customer_phone}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {order.customer_address}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thú cưng */}
                  {order.pet_name && (
                    <div className="bg-white rounded-xl p-5 border border-[#f3ebe7] shadow-sm">
                      <h3 className="text-xs font-bold text-[#9a624c] uppercase mb-4 flex items-center gap-2">
                        <Pets className="w-[18px] h-[18px]" />
                        Thông tin thú cưng
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                          <Pets className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                          <div className="font-bold text-[#1b110d] text-base">
                            {order.pet_name}
                          </div>
                          <div className="text-sm text-[#9a624c] mt-0.5">
                            {order.pet_breed}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              {order.pet_weight}kg
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              {order.pet_gender}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Khu vực Hủy Đơn */}
                  {isCompleted && (
                    <div className="bg-red-50 rounded-xl border border-red-100 p-5 mt-auto">
                      <div className="flex items-center gap-2 mb-3 text-red-700">
                        <Warning className="w-5 h-5" />
                        <h3 className="font-bold text-xs uppercase">
                          Hủy giao dịch & Hoàn tiền
                        </h3>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-[#1b110d] mb-1.5 uppercase">
                          Lý do hủy đơn <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full rounded-lg border-red-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[80px] placeholder-gray-400 resize-none p-3 outline-none"
                          placeholder="Nhập lý do chi tiết..."
                        ></textarea>
                      </div>
                      <button
                        onClick={handleCancelOrder}
                        disabled={isCanceling}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-200/50 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isCanceling ? (
                          <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CurrencyExchange className="w-[18px] h-[18px]" />
                        )}
                        {isCanceling
                          ? "Đang xử lý hoàn tiền..."
                          : "Xác nhận Hủy & Hoàn tiền"}
                      </button>
                    </div>
                  )}

                  {/* Khu vực Đã Hủy */}
                  {isCancelled && (
                    <div className="bg-red-50 rounded-xl border border-red-100 p-5 mt-auto flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                        <Close className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="font-bold text-red-700 text-lg">
                        Đơn hàng đã bị hủy
                      </h3>
                      <p className="text-xs text-red-500 mt-1">
                        Hệ thống đã ghi nhận hoàn tiền cho khách
                      </p>
                      <div className="w-full bg-white rounded-lg p-3 mt-4 text-left border border-red-100">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Lý do hủy:
                        </p>
                        <p className="text-sm text-[#1b110d] italic">
                          "{cancelReason || "Không có lý do"}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cột phải: Chi tiết sản phẩm/dịch vụ */}
                <div className="w-full lg:w-2/3 flex flex-col h-full">
                  <div className="bg-white rounded-xl border border-[#f3ebe7] shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#f3ebe7] bg-gray-50/50 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-[#1b110d] flex items-center gap-2">
                        <ShoppingBag className="w-[18px] h-[18px] text-[#9a624c]" />
                        Sản phẩm & Dịch vụ
                      </h3>
                      <span className="text-xs font-medium text-[#9a624c] bg-white px-2 py-1 rounded border border-[#f3ebe7]">
                        {order.details.length} items
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#fcf9f8] text-[#9a624c] text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-6 py-3 border-b border-[#f3ebe7] w-12 text-center">
                              #
                            </th>
                            <th className="px-6 py-3 border-b border-[#f3ebe7]">
                              Tên sản phẩm
                            </th>
                            <th className="px-6 py-3 border-b border-[#f3ebe7] text-center w-24">
                              SL
                            </th>
                            <th className="px-6 py-3 border-b border-[#f3ebe7] text-right w-32">
                              Đơn giá
                            </th>
                            <th className="px-6 py-3 border-b border-[#f3ebe7] text-right w-32">
                              Thành tiền
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3ebe7] bg-white">
                          {order.details.map((detail, index) => (
                            <tr
                              key={detail.id}
                              className="hover:bg-gray-50 transition-colors group"
                            >
                              <td className="px-6 py-4 text-center text-gray-400 text-xs">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-[#1b110d]">
                                  {detail.product_name || detail.service_name}
                                </div>
                                <div className="text-xs text-[#9a624c] mt-0.5">
                                  {detail.service_name
                                    ? "Dịch vụ Spa"
                                    : "Thức ăn thú cưng"}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center font-medium bg-gray-50/50 group-hover:bg-gray-100/50">
                                {detail.quantity}
                              </td>
                              <td className="px-6 py-4 text-right text-[#9a624c]">
                                {Number(detail.price).toLocaleString("vi-VN")}đ
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-[#1b110d]">
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

                    {/* Footer Tổng Tiền */}
                    <div className="bg-gray-50 border-t border-[#f3ebe7] p-6 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#9a624c]">Tạm tính</span>
                        <span className="font-medium text-[#1b110d]">
                          {Number(order.total_amount).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#9a624c]">Giảm giá</span>
                        <span className="font-medium text-green-600">-0đ</span>
                      </div>
                      <div className="h-px bg-[#f3ebe7] my-1"></div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-bold text-[#1b110d] text-base">
                          {isCancelled
                            ? "Tổng tiền đã hoàn trả"
                            : "Tổng tiền thanh toán"}
                        </span>
                        <span
                          className={`font-bold text-2xl transition-colors ${isCancelled ? "text-red-500" : "text-[#e09a80]"}`}
                        >
                          {Number(order.total_amount).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="px-8 py-5 bg-white border-t border-[#f3ebe7] flex justify-between items-center shrink-0 h-20">
            <button className="text-[#9a624c] hover:text-[#1b110d] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
              <Print className="w-5 h-5" />
              In hóa đơn
            </button>
            <button
              onClick={onClose}
              className="bg-[#fcf9f8] border border-[#f3ebe7] text-[#1b110d] hover:bg-gray-100 hover:border-gray-300 font-semibold py-2.5 px-8 rounded-xl transition-all shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
