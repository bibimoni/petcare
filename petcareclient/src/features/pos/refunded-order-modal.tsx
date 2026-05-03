import {
  Clock,
  Receipt,
  X as Close,
  ShoppingBag,
  Phone,
  MapPin,
  Package,
} from "lucide-react";
import { useState, useEffect } from "react";

import { getOrderDetail } from "./api";
import type { Order } from "./type";

interface RefundedOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

export const RefundedOrderModal = ({
  orderId,
  isOpen,
  onClose,
}: RefundedOrderModalProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const detail = await getOrderDetail(orderId);
        if (detail) {
          setOrder(detail);
        }
      } finally {
        setIsLoading(false);
      }
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
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium text-sm">
                Đang tải thông tin đơn hoàn...
              </p>
            </div>
          ) : order ? (
            <div className="flex-1 overflow-y-auto p-6 bg-[#fcf9f8]/50 custom-scrollbar">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#f3ebe7] flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[#1b110d] flex items-center gap-2">
                      Chi tiết đơn hàng #{order.order_id}
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 uppercase tracking-wide">
                        Đã hoàn tiền
                      </span>
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-[#9a624c] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {order.created_at}
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

              {/* Nội dung chính */}
              <div className="flex flex-col py-5 md:flex-row gap-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-4 w-full md:w-1/3">
                  {/* Khách hàng */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f3ebe7] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#f7b297]/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#f7b297]/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold border border-orange-200 shrink-0">
                          {order.customer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1b110d]">
                            {order.customer.full_name}
                          </div>
                          <div className="text-[10px] text-[#9a624c] uppercase tracking-wider font-semibold">
                            Khách hàng
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 relative z-10 pl-13">
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <Phone className="w-4 h-4" />
                        <span>{order.customer.phone || "--"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <MapPin className="w-4 h-4" />
                        <span
                          className={
                            !order.customer.address
                              ? "italic text-gray-400"
                              : ""
                          }
                        >
                          {order.customer.address || "Chưa cập nhật địa chỉ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#f3ebe7] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#f7b297]/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#f7b297]/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold border border-orange-200 shrink-0">
                          {order.order_details[0].pet.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1b110d]">
                            {order.order_details[0].pet.name}
                          </div>
                          <div className="text-[10px] text-[#9a624c] uppercase tracking-wider font-semibold">
                            Thú cưng
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 relative z-10 pl-13">
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <span>
                          Giống: {order.order_details[0].pet.breed || "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <span>{order.order_details[0].pet.notes}</span>
                      </div>
                    </div>
                  </div>
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
                        {order.order_details.length} sản phẩm
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
                          {order.order_details.map((detail) => (
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
                                      {detail.item_type === "PRODUCT"
                                        ? detail.product?.name
                                        : detail.service?.combo_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center font-medium">
                                {detail.quantity}
                              </td>
                              <td className="px-5 py-3 text-right text-[#9a624c]">
                                {Number(detail.unit_price).toLocaleString(
                                  "vi-VN",
                                )}
                                đ
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-[#1b110d]">
                                {(
                                  Number(detail.unit_price) * detail.quantity
                                ).toLocaleString("vi-VN")}
                                đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-auto bg-gray-50 border-t border-[#f3ebe7] p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#9a624c]">Tạm tính:</span>
                          <span className="font-medium text-[#1b110d]">
                            {Number(order.total_amount).toLocaleString("vi-VN")}
                            đ
                          </span>
                        </div>
                        <div className="h-px bg-[#f3ebe7] my-1"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#1b110d] font-bold">
                            Tổng tiền hoàn:
                          </span>
                          <span className="text-xl font-['Plus_Jakarta_Sans'] font-bold text-[#9a624c] decoration-blue-500/50 decoration-2">
                            {Number(order.total_amount).toLocaleString("vi-VN")}
                            đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#f3ebe7] bg-gray-50 flex items-center justify-between shrink-0 rounded-b-3xl">
                <div className="gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 cursor-pointer bg-[#1b110d] text-white font-medium rounded-lg hover:bg-black transition-all shadow-lg shadow-gray-200 text-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
