export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string; // Đơn vị tính
  image: string;
  stock: number;
  location: string; // Vị trí kho
  salePrice: number;
  importPrice: number;
  expiryDate?: string;
  status: "Còn hàng" | "Hết hàng" | "Sắp hết";
  category: "Thú cưng" | "Vật dụng" | "Thức ăn" | "Dịch vụ";
}
