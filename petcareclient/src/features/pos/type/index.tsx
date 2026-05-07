export interface OrderDetail {
  pet: Pet;
  id: number;
  order_id: number;
  quantity: number;
  subtotal: string;
  item_type: string;
  service?: Service;
  product?: Product;
  unit_price: string;
  original_cost: string;
}

export interface Service {
  id: number;
  price: string;
  status: string;
  store_id: number;
  combo_name: string;
  min_weight: number;
  max_weight: number;
  category_id: number;
  description: string;
}

export interface Product {
  name: string;
  store_id: number;
  product_id: number;
  cost_price: string;
  sell_price: string;
  category_id: number;
  description: string;
  expiry_date: string;
  stock_quantity: number;
  min_stock_level: number;
}

export interface Pet {
  dob: string;
  name: string;
  breed: string;
  notes: string;
  pet_id: number;
  gender: string;
  status: string;
  pet_code: string;
  store_id: number;
}

export interface CustomerDetail {
  email: string;
  notes: string;
  phone: string;
  address: string;
  store_id: number;
  full_name: string;
  customer_id: number;
  total_spend: number;
}

export interface Order {
  order_id: number;
  created_at: string;
  total_amount: number;
  cancel_reason?: string;
  refund_reason?: string;

  customer: CustomerDetail;
  order_details: OrderDetail[];
  cancelled_by_user_id?: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
}
