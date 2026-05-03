export interface OrderDetail {
  id: number;
  order_id: number;
  item_type: string;
  original_cost: string;
  quantity: number;
  subtotal: string;
  unit_price: string;
  service?: Service;
  product?: Product;
  pet: Pet;
}

export interface Service {
  id: number;
  category_id: number;
  combo_name: string;
  description: string;
  min_weight: number;
  max_weight: number;
  price: string;
  status: string;
  store_id: number;
}

export interface Product {
  product_id: number;
  category_id: number;
  cost_price: string;
  description: string;
  expiry_date: string;
  min_stock_level: number;
  name: string;
  sell_price: string;
  stock_quantity: number;
  store_id: number;
}

export interface Pet {
  pet_id: number;
  breed: string;
  dob: string;
  gender: string;
  name: string;
  notes: string;
  pet_code: string;
  status: string;
  store_id: number;
}

export interface CustomerDetail {
  address: string;
  customer_id: number;
  email: string;
  full_name: string;
  notes: string;
  phone: string;
  store_id: number;
  total_spend: number;
}

export interface Order {
  created_at: string;
  order_id: number;
  total_amount: number;
  customer: CustomerDetail;
  cancel_reason?: string;
  cancelled_by_user_id?: number;
  order_details: OrderDetail[];
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
}
