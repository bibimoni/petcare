export interface Product {
  id: string;
  image: string;
  sku: string;
  name: string;
  category: "Thú cưng" | "Vật dụng" | "Thức ăn" | "Dịch vụ";
  unit: string; // Đơn vị tính
  importPrice: number;
  salePrice: number;
  stock: number;
  location: string; // Vị trí kho
  expiryDate?: string;
  status: "Còn hàng" | "Hết hàng" | "Sắp hết";
}
