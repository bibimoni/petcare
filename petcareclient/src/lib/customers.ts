import api from "./api"; // Import cái axiosClient từ file api.ts cùng folder

export const CustomerService = {
  // Hàm lấy danh sách khách hàng
  getAll: async () => {
    // Chỉ cần truyền phần đuôi của URL, vì api.ts đã có baseURL rồi
    return await api.get("/customers");
  },

  // Khôi có thể thêm hàm tạo mới ở đây nếu cần test
  create: async (data: any) => {
    return await api.post("/customers", data);
  },
};
