import { useState, useEffect } from "react";
import {
  X as Close,
  Receipt,
  Clock,
  User as Person,
  AlertCircle,
  Pets,
  ShoppingBag,
} from "lucide-react";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface OrderDetail {
  id: number;
  product_name: string;
  category_name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  code: string;
  status: "CANCELLED";
  created_at: string;
  cashier_name: string;
  cancel_reason: string;
  customer_name: string;
  customer_phone?: string;
  customer_group?: string;
  customer_address?: string;
  pet_name?: string;
  total_amount: number;
  details: OrderDetail[];
}

interface CancelledOrderModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock
const MOCK_CANCELLED_ORDER: Order = {
  id: 919,
  code: "POS-0919",
  status: "CANCELLED",
  created_at: "08:45 - 20/10/2023",
  cashier_name: "Minh Trang",
  cancel_reason: "Khách hàng thay đổi ý định, không mua nữa.",
  customer_name: "Lê Văn Tùng",
  customer_phone: "0999.888.777",
  customer_group: "Thân thiết",
  customer_address: "Quận 3, TP.HCM",
  pet_name: "",
  total_amount: 110000,
  details: [
    {
      id: 1,
      product_name: "Đồ chơi Xương Gai",
      category_name: "Phụ kiện thú cưng",
      quantity: 1,
      price: 50000,
    },
    {
      id: 2,
      product_name: "Cát vệ sinh (5L)",
      category_name: "Vệ sinh thú cưng",
      quantity: 1,
      price: 60000,
    },
  ],
};

export const CancelledOrderModal = ({
  orderId,
  isOpen,
  onClose,
}: CancelledOrderModalProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tải chi tiết đơn hàng (Giả lập API)
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      // Giả lập delay mạng
      await new Promise((resolve) => setTimeout(resolve, 400));
      setOrder({
        ...MOCK_CANCELLED_ORDER,
        id: orderId,
        code: `POS-0${orderId}`,
      });
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className="bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(243,235,231,1)] w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 border border-[#f3ebe7]"
          onClick={(e) => e.stopPropagation()} // Chặn sự kiện click ra ngoài
        >
          {isLoading ? (
            <div className="flex flex-col gap-4 justify-center items-center h-[50vh] text-[#9a624c]">
              <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium text-sm">
                Đang tải thông tin đơn hủy...
              </p>
            </div>
          ) : order ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#f3ebe7] flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[#1b110d] flex items-center gap-2">
                      Chi tiết đơn hàng #{order.code}
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200 uppercase tracking-wide">
                        Đã hủy
                      </span>
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-[#9a624c] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {order.created_at}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="flex items-center gap-1">
                        <Person className="w-3.5 h-3.5" /> Thu ngân:{" "}
                        {order.cashier_name}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                  title="Đóng"
                >
                  <Close className="w-5 h-5" />
                </button>
              </div>

              {/* Lý do hủy (Banner đỏ) */}
              <div className="px-6 pt-4 pb-0 bg-[#fcf9f8]/50">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                  <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="text-red-600 w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 text-sm">
                      Lý do hủy đơn
                    </h4>
                    <p className="text-red-600 text-sm mt-0.5">
                      {order.cancel_reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nội dung chính */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#fcf9f8]/50 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cột trái: Khách hàng & Thú cưng */}
                  <div className="flex flex-col gap-4">
                    {/* Block Khách hàng */}
                    <div className="bg-white rounded-xl border border-[#f3ebe7] shadow-sm p-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#f7b297]/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                      <h3 className="font-bold text-[#1b110d] text-sm flex items-center gap-2 mb-3">
                        <Person className="text-[#f7b297] w-[18px] h-[18px]" />
                        Khách hàng
                      </h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-bold border border-red-100 shrink-0">
                          {order.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-[#1b110d] text-sm truncate">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-[#9a624c]">
                            {order.customer_phone || "--"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-[#f3ebe7]">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#9a624c]">Nhóm khách:</span>
                          <span className="font-medium text-[#1b110d] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                            {order.customer_group || "Khách lẻ"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-start">
                          <span className="text-[#9a624c] shrink-0">
                            Địa chỉ:
                          </span>
                          <span className="font-medium text-[#1b110d] text-right break-words max-w-[60%]">
                            {order.customer_address || "Chưa cập nhật"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Block Thú cưng */}
                    <div className="bg-white rounded-xl border border-[#f3ebe7] shadow-sm p-4">
                      <h3 className="font-bold text-[#1b110d] text-sm flex items-center gap-2 mb-3">
                        <Pets className="text-[#f7b297] w-[18px] h-[18px]" />
                        Thú cưng
                      </h3>
                      {order.pet_name ? (
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shrink-0">
                            <Pets className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-[#1b110d] text-sm">
                              {order.pet_name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center bg-[#fcf9f8]/30 rounded-lg border border-[#f3ebe7] border-dashed">
                          <div className="size-10 rounded-full bg-[#fcf9f8] flex items-center justify-center text-[#9a624c] mb-2">
                            <Pets className="text-xl opacity-40 w-5 h-5" />
                          </div>
                          <span className="text-xs text-[#9a624c]">
                            Không có thông tin
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cột phải: Danh sách sản phẩm */}
                  <div className="md:col-span-2 flex flex-col gap-4">
                    <div className="bg-white rounded-xl border border-[#f3ebe7] shadow-sm overflow-hidden flex flex-col h-full">
                      <div className="p-4 border-b border-[#f3ebe7] bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-[#1b110d] text-sm flex items-center gap-2">
                          <ShoppingBag className="text-[#f7b297] w-[18px] h-[18px]" />
                          Danh sách sản phẩm
                        </h3>
                        <span className="text-xs text-[#9a624c] bg-white px-2 py-1 rounded border border-[#f3ebe7]">
                          {order.details.length} sản phẩm
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[#fcf9f8] text-[#9a624c] text-[11px] uppercase font-medium border-b border-[#f3ebe7]">
                            <tr>
                              <th className="px-4 py-2 font-semibold pl-6">
                                Tên hàng
                              </th>
                              <th className="px-4 py-2 font-semibold text-center w-16">
                                SL
                              </th>
                              <th className="px-4 py-2 font-semibold text-right">
                                Đơn giá
                              </th>
                              <th className="px-4 py-2 font-semibold text-right pr-6">
                                Thành tiền
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f3ebe7]">
                            {order.details.map((item) => (
                              <tr
                                key={item.id}
                                className="group hover:bg-[#fcf9f8]/30 transition-colors"
                              >
                                <td className="px-4 py-3 pl-6">
                                  <div className="font-medium text-[#1b110d] text-sm">
                                    {item.product_name}
                                  </div>
                                  <div className="text-[11px] text-[#9a624c]">
                                    {item.category_name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-[#1b110d]">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-[#1b110d]">
                                  {Number(item.price).toLocaleString("vi-VN")}đ
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-[#1b110d] pr-6">
                                  {(
                                    Number(item.price) * item.quantity
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Tạm tính & Tổng tiền */}
                      <div className="mt-auto bg-gray-50 border-t border-[#f3ebe7] p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#9a624c]">Tạm tính:</span>
                            <span className="font-medium text-[#1b110d]">
                              {Number(order.total_amount).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#9a624c]">Giảm giá:</span>
                            <span className="font-medium text-[#1b110d]">
                              0đ
                            </span>
                          </div>
                          <div className="h-px bg-[#f3ebe7] my-1"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#1b110d] font-bold">
                              Tổng tiền hủy:
                            </span>
                            <span className="text-xl font-['Plus_Jakarta_Sans'] font-bold text-[#9a624c] line-through decoration-red-500/50 decoration-2">
                              {Number(order.total_amount).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#f3ebe7] bg-gray-50 flex items-center justify-between shrink-0 rounded-b-3xl">
                <button className="px-4 py-2 bg-white border border-[#f3ebe7] text-[#1b110d] font-medium rounded-lg hover:bg-[#fcf9f8] hover:text-red-600 transition-colors shadow-sm text-sm">
                  In hóa đơn hủy
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-[#1b110d] text-white font-medium rounded-lg hover:bg-black transition-all shadow-lg shadow-gray-200 text-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};
