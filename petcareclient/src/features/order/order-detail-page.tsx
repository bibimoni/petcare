import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OrderApi } from "../../lib/orders";
import { handleApiError } from "@/lib/api";
import OrderHeader from "./components/order-header";
import OrderCustomer from "./components/order-customer";
import OrderPet from "./components/order-pet";
import OrderItems from "./components/order-items";
import OrderSummary from "./components/order-summary";
import { MOCK_ORDER_DETAIL } from "./data/mock-order"; 


export default function OrderDetailPage({ orderId }: { orderId: string }) {
  // KHỞI TẠO: Dùng MOCK_ORDER_DETAIL ngay từ đầu để không bao giờ bị null
  const [order, setOrder] = useState<any>(MOCK_ORDER_DETAIL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const res = await OrderApi.getDetail(orderId);
        // axiosClient trả về data trực tiếp hoặc qua res.data tùy cấu trúc BE
        if (res) {
          setOrder(res?.data || res);
        }
      } catch (err) {
        // Nếu API lỗi (404/500), giao diện vẫn giữ nguyên Mock Data để demo
        console.warn("⚠️ Không kết nối được API, đang hiển thị Mock Data.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Chỉ báo trạng thái đang tải (nhỏ gọn ở góc) */}
        {loading && (
          <div className="absolute top-4 right-16 flex items-center gap-2 text-[10px] text-primary-dark font-bold animate-pulse">
            <span className="size-2 bg-primary-dark rounded-full"></span>
            SYNCING API...
          </div>
        )}

        {/* HEADER: Chứa mã đơn và trạng thái */}
        <OrderHeader order={order} />

        <div className="flex flex-1 p-8 gap-8 overflow-hidden bg-[#FAFAFA]">
          
          {/* CỘT TRÁI: Thông tin khách hàng & Pet */}
          <div className="w-1/3 flex flex-col gap-5">
            {/* Sử dụng Optional Chaining ?. để an toàn tuyệt đối */}
            <OrderCustomer customer={order?.customer} />
            <OrderPet pet={order?.pet} />
          </div>

          {/* CỘT PHẢI: Danh sách sản phẩm & Tổng tiền */}
          <div className="w-2/3 flex flex-col h-full gap-4">
            <OrderItems items={order?.order_details || []} />
            <OrderSummary order={order} />
          </div>

        </div>
      </div>
    </div>
  );
}