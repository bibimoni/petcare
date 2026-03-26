import api from "@/lib/api";

export const OrderApi = {
  // Lấy chi tiết đơn hàng (axiosClient tự động lo phần /v1 và Token)
  getDetail: (id: string) => api.get(`/orders/${id}`),
};
