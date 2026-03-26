import { useState, useEffect } from "react";
import { OrderService } from "@/lib/orders";
import { handleApiError } from "@/lib/api";

// Mock data dự phòng theo đúng Database Schema Khôi gửi
const MOCK_ORDER_DETAIL = {
    order_id: "POS-0922",
    status: "COMPLETED",
    total_amount: 637200,
    customer: {
        full_name: "Nguyễn Văn A",
        phone: "0987.654.321",
        address: "Hà Nội, Việt Nam"
    },
    pet: {
        name: "Lu",
        breed: "Chó Poodle",
        weight: 5,
        gender: "Đực"
    },
    order_details: [
        { id: 1, product: { name: "Gói Spa Cắt Tỉa (Full)" }, quantity: 1, subtotal: 450000 },
        { id: 2, product: { name: "Pate Whiskas Vị Cá Biển 400g" }, quantity: 2, subtotal: 187200 }
    ]
};

export default function OrderDetailModal({ orderId, onClose }: { orderId: string, onClose: () => void }) {
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const res = await OrderService.getDetail(orderId);
                setOrder(res);
            } catch (err) {
                console.warn("⚠️ Không kết nối được API, đang dùng Mock Data để demo.");
                setOrder(MOCK_ORDER_DETAIL); // Chỗ này giúp Khôi vẫn hiện được giao diện
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    if (loading || !order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-[fade-in_0.3s_ease-out]">
                {/* Phần Header */}
                <div className="px-8 py-5 border-b flex justify-between items-center bg-white h-20">
                    <div>
                        <h2 className="text-xl font-bold font-display text-text-main">Chi tiết đơn hàng</h2>
                        <div className="flex items-center gap-3 text-sm mt-1">
                            <span className="text-text-muted">Mã đơn: <span className="text-text-main font-bold">#{order.order_id}</span></span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main p-2">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA] flex gap-8 flex-col lg:flex-row">
                    {/* Cột trái: Khách & Pet */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-5">
                        <div className="bg-white rounded-xl p-5 border shadow-sm">
                            <h3 className="text-xs font-bold text-text-muted uppercase mb-4">Thông tin khách hàng</h3>
                            <div className="font-bold">{order.customer?.full_name}</div>
                            <div className="text-sm text-text-muted">{order.customer?.phone}</div>
                        </div>
                        <div className="bg-white rounded-xl p-5 border shadow-sm">
                            <h3 className="text-xs font-bold text-text-muted uppercase mb-4">Thông tin thú cưng</h3>
                            <div className="font-bold">{order.pet?.name}</div>
                            <div className="text-sm text-text-muted">{order.pet?.breed} - {order.pet?.weight}kg</div>
                        </div>
                    </div>

                    {/* Cột phải: Sản phẩm */}
                    <div className="w-full lg:w-2/3 flex flex-col">
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-background-light text-text-muted text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-3 border-b">Tên sản phẩm/dịch vụ</th>
                                        <th className="px-6 py-3 border-b text-center">SL</th>
                                        <th className="px-6 py-3 border-b text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color">
                                    {order.order_details?.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium">{item.product?.name || item.service?.name}</td>
                                            <td className="px-6 py-4 text-center">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right font-bold">
                                                {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-gray-50 border-t p-6 text-right">
                                <span className="font-bold text-text-main mr-4">Tổng tiền thanh toán:</span>
                                <span className="font-bold text-2xl text-primary-dark">
                                    {new Intl.NumberFormat('vi-VN').format(order.total_amount)}đ
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}