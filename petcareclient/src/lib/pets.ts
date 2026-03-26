import api from "./api";

export const PetService = {
  // Lấy danh sách tất cả pet (thường BE sẽ trả về theo Store hoặc Customer)
  getAll: async () => {
    // Dựa vào lỗi 404 nãy, mình chỉ để /pets (bỏ /v1 vì baseURL đã có rồi)
    return await api.get("/pets"); 
  },

  // Lấy pet của một khách hàng cụ thể (nếu cần)
  getByCustomer: async (customerId: number) => {
    return await api.get(`/customers/${customerId}/pets`);
  }
};