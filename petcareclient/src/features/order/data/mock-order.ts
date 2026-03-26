// src/features/orders/data/mock-order.ts
export const MOCK_ORDER_DETAIL = {
  order_id: "POS-0922",
  status: "COMPLETED",
  total_amount: 637200,
  customer: {
    full_name: "Nguyễn Văn A",
    phone: "0987.654.321",
    address: "Hà Nội, Việt Nam",
  },
  pet: {
    name: "Lu",
    breed: "Chó Poodle",
    weight: 5,
    gender: "MALE", // Khớp với Logic Đực/Cái ở component
  },
  order_details: [
    {
      id: 1,
      product: { name: "Gói Spa Cắt Tỉa (Full)" },
      quantity: 1,
      unit_price: 450000,
      subtotal: 450000,
    },
    {
      id: 2,
      product: { name: "Pate Whiskas Vị Cá Biển 400g" },
      quantity: 2,
      unit_price: 93600,
      subtotal: 187200,
    },
  ],
};