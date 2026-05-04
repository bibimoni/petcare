import { useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Phone,
  MapPin,
  Package,
  X as Close,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AlertDialog } from "@/components/ui/alert-dialog";

import type { Order } from "./type";

import {
  refundOrder,
  getOrderDetail,
  getOrderPayment,
  type OrderPaymentDto,
} from "./api";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onStatusChange: () => void;
}

export const OrderDetailModal = ({
  orderId,
  isOpen,
  onClose,
  onStatusChange,
}: OrderDetailModalProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<OrderPaymentDto | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const queryClient = useQueryClient();

  // Tải chi tiết đơn hàng
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const detail = await getOrderDetail(orderId);
        if (detail) {
          setOrder(detail);
        }
      } catch (_error) {
        toast.error("Không tải được chi tiết đơn hàng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isOpen]);

  useEffect(() => {
    if (!isOpen || !orderId) return;
    const fetchPayment = async () => {
      try {
        const result = await getOrderPayment(Number(orderId));
        setPayment(result ?? null);
      } catch {
        setPayment(null);
      }
    };
    fetchPayment();
  }, [orderId, isOpen]);

  // Xử lý refund đơn
  const handleRefund = async () => {
    setIsRefunding(true);
    try {
      await refundOrder(orderId ?? order?.order_id ?? 0);
      toast.success(
        "Hoàn tiền thành công, vui lòng kiểm tra hoá đơn hoàn tiền để xem thêm chi tiết",
      );
      onStatusChange();
      onClose();
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          (query.queryKey[0] === "pos-recent-orders" ||
            query.queryKey[0].startsWith("pos-orders")),
      });
    } catch (_error) {
      // global error
    } finally {
      setIsRefunding(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(0,0,0,0.05)] w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="px-8 py-5 border-b border-[#f3ebe7] flex items-center justify-between bg-white shrink-0 h-20">
            <div className="flex items-center gap-4">
              {/* Icon Trạng thái */}
              <div
                className={`size-11 rounded-full flex items-center justify-center border shadow-sm ${"bg-green-50 text-green-600 border-green-100"}`}
              >
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#1b110d] leading-tight">
                  Chi tiết đơn hàng
                </h2>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-[#9a624c] font-medium">
                    Mã đơn:{" "}
                    <span className="text-[#1b110d] font-bold">
                      #{order.order_id}
                    </span>
                  </span>
                  <span className="text-gray-300">|</span>
                  {/* Badge Trạng thái */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${"bg-green-50 text-green-700 border-green-100"}`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${"bg-green-500"}`}
                    ></span>
                    Hoàn thành
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#9a624c] hover:text-[#1b110d] cursor-pointer hover:bg-[#fcf9f8] p-2 rounded-lg transition-colors"
            >
              <Close className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA] custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-4 justify-center items-center h-full text-[#9a624c]">
                <div className="w-8 h-8 border-4 border-[#f7b297] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium text-sm">
                  Đang tải chi tiết đơn hàng...
                </p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
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
                          {order.order_details[0].pet?.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1b110d]">
                            {order.order_details[0].pet?.name}
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
                          Giống: {order.order_details[0].pet?.breed || "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#9a624c]">
                        <span>{order.order_details[0].pet?.notes}</span>
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
                        <span className="font-bold text-[#9a624c] text-xl">
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
            <div className="p-6 border-t border-[#f3ebe7] bg-white shrink-0 z-10 flex flex-row items-center justify-between gap-4">
              {/* Left: Xem hoá đơn */}
              {payment?.stripe_receipt_url ? (
                <a
                  href={payment.stripe_receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-[140px] px-6 py-3.5 cursor-pointer bg-[#f27a4d] text-white font-semibold rounded-xl hover:bg-[#e86c42] transition-all shadow-lg shadow-gray-200 text-sm flex items-center justify-center"
                >
                  Xem hoá đơn
                </a>
              ) : (
                <div />
              )}
              {/* Right: Refund & Close */}
              <div className="flex flex-row gap-4 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowRefundConfirm(true)}
                  disabled={isRefunding}
                  className="min-w-[140px] bg-white cursor-pointer hover:bg-red-50 text-[#9a624c] hover:text-red-600 font-semibold py-3.5 px-6 rounded-xl border border-gray-200 hover:border-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Ban className="w-5 h-5" />
                  Hoàn tiền
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[140px] bg-[#A8E6CF] cursor-pointer hover:bg-[#8addb6] text-emerald-900 font-bold py-3.5 px-6 rounded-xl shadow-[0_0_20px_-5px_rgba(168,230,207,0.5)] hover:shadow-lg hover:shadow-[#A8E6CF]/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  <Close className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" />
                  <span className="text-base">Đóng</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        open={showRefundConfirm}
        onOpenChange={setShowRefundConfirm}
        title="Hoàn đơn"
        description="Bạn có chắc chắn muốn hoàn tiền? Hành động này không thể hoàn tác."
        actionLabel="Hoàn tiền"
        cancelLabel="Đóng"
        onConfirm={() => {
          setShowRefundConfirm(false);
          handleRefund();
        }}
      />
    </>
  );
};
