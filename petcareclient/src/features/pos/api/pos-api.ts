import {
  type ProductDto,
  type CategoryDto,
  getProductsForTable,
  getProductCategories,
  getProductsByCategoryId,
} from "@/features/inventory/api/products.api";
import {
  type ServiceDto,
  getServicesForTable,
  getServiceCategories,
  getServicesByCategoryId,
  type ServiceCategoryDto,
} from "@/features/service/api/service.api";
import axiosClient from "@/lib/api";

import { toNumber, formatPrice } from "../utils";

/* eslint-disable sort-keys */

const productFallbackImages = [
  "/images/hero-page/pet-food.jpg",
  "/images/hero-page/pet-accessories.jpg",
  "/images/hero-page/spa-grooming.jpg",
  "/images/hero-page/spa-service.jpg",
  "/images/hero-page/spa-experience.jpg",
];

const getServiceIconMeta = (serviceName: string) => {
  const name = serviceName.toLowerCase();

  if (name.includes("tắm") || name.includes("sấy")) {
    return { icon: "shower", iconTone: "bg-[#e0f2f1] text-[#1b7b79]" };
  }

  if (name.includes("cắt") || name.includes("tỉa")) {
    return { icon: "content_cut", iconTone: "bg-[#fde8de] text-[#c36d47]" };
  }

  if (name.includes("tiêm") || name.includes("khám") || name.includes("y tế")) {
    return {
      icon: "medical_services",
      iconTone: "bg-[#e9f3eb] text-[#2f8a55]",
    };
  }

  if (
    name.includes("trông") ||
    name.includes("lưu trú") ||
    name.includes("khách sạn") ||
    name.includes("ngày")
  ) {
    return { icon: "home", iconTone: "bg-[#e9f3eb] text-[#5e8f68]" };
  }

  return { icon: "pets", iconTone: "bg-[#f3ebe7] text-[#8b6955]" };
};

const parseNumber = (value: number | string | null | undefined): number => {
  const parsed = toNumber(value);
  return parsed ?? 0;
};

export type PosService = {
  id: number;
  name: string;
  icon: string;
  price: string;
  rawPrice: number;
  iconTone: string;
  minWeight: number;
  maxWeight: number;
  categoryId: number;
  description: string;
  categoryName: string;
};

export type PosProduct = {
  id: number;
  name: string;
  price: string;
  stock: number;
  image: string;
  description: string;
};

export type OrderPaymentDto = {
  amount: number;
  created_at: string;
  error_message: string | null;
  order_id: number;
  payment_id: number;
  payment_method: string;
  stripe_charge_id: string | null;
  stripe_client_secret: string | null;
  stripe_checkout_session_id: string | null;
  stripe_checkout_url: string | null;
  stripe_payment_intent_id: string | null;
  stripe_receipt_url: string | null;
  updated_at: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
};

export type OrderDetailDto = {
  cashier_name?: string;
  cancel_reason?: string | null;
  code: string;
  created_at?: string;
  customer_address?: string;
  customer_name: string;
  customer_phone?: string;
  customer_type?: string;
  details: Array<{
    category_name?: string;
    code?: string;
    id: number;
    price: number;
    product_name?: string;
    quantity: number;
    service_name?: string;
  }>;
  id: number;
  pet_age?: string;
  pet_breed?: string;
  pet_gender?: string;
  pet_name?: string;
  pet_type?: string;
  pet_weight?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  total_amount: number;
};

export type OrderListItemDto = {
  cancel_reason?: string | null;
  cancelled_by_user_id?: number | null;
  created_at: string;
  customer: {
    address?: string | null;
    customer_id: number;
    email?: string | null;
    full_name: string;
    phone?: string | null;
  } | null;
  customer_id: number;
  note?: string | null;
  order_details: Array<{
    id: number;
    item_type: "PRODUCT" | "SERVICE";
    product?: {
      name?: string | null;
      product_id: number;
    } | null;
    product_id?: number | null;
    quantity: number;
    service?: {
      combo_name?: string | null;
      id: number;
    } | null;
    service_id?: number | null;
    subtotal: string;
    unit_price: string;
  }>;
  order_id: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  store_id: number;
  total_amount: string;
  updated_at: string;
  user_id: number;
};

export type OrdersListResponseDto = {
  data: OrderListItemDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
const mapServiceDto = (service: ServiceDto, index: number): PosService => {
  const serviceName = String(service.combo_name ?? "Dịch vụ");
  const iconMeta = getServiceIconMeta(serviceName);

  return {
    id: parseNumber(service.id) || index + 1,
    name: serviceName,
    icon: iconMeta.icon,
    price: formatPrice(service.price),
    rawPrice: parseNumber(service.price),
    categoryId: parseNumber(service.category_id),
    categoryName:
      typeof service.category_name === "string" && service.category_name.trim()
        ? service.category_name
        : "Khác",
    minWeight: parseNumber(service.min_weight),
    maxWeight: parseNumber(service.max_weight),
    iconTone: iconMeta.iconTone,
    description:
      typeof service.description === "string" && service.description.trim()
        ? service.description
        : "Tắm, sấy, cắt tỉa, mài móng",
  };
};

const mapProductDto = (product: ProductDto, index: number): PosProduct => {
  const image =
    typeof product.image_url === "string" && product.image_url.trim()
      ? product.image_url
      : productFallbackImages[index % productFallbackImages.length];

  return {
    description:
      typeof product.description === "string" && product.description.trim()
        ? product.description
        : "Sản phẩm cho thú cưng",
    id: parseNumber(product.product_id) || index + 1,
    image,
    name: String(product.name ?? "Sản phẩm"),
    price: formatPrice(product.sell_price),
    stock: parseNumber(product.stock_quantity),
  };
};

export const getPosServiceCategories = async (): Promise<
  ServiceCategoryDto[]
> => getServiceCategories();

export const getPosProductCategories = async (): Promise<CategoryDto[]> =>
  getProductCategories();

export const getPosServices = async (
  categoryId: string,
): Promise<PosService[]> => {
  const services =
    categoryId === "all"
      ? await getServicesForTable("all")
      : await getServicesByCategoryId(categoryId);

  return services.map(mapServiceDto);
};

export const getPosProducts = async (
  categoryId: string,
): Promise<PosProduct[]> => {
  const products =
    categoryId === "all"
      ? await getProductsForTable("all")
      : await getProductsByCategoryId(categoryId);

  return products.map(mapProductDto);
};

export const getPosCatalogOverview = async (): Promise<{
  services: PosService[];
  products: PosProduct[];
}> => {
  const [services, products] = await Promise.all([
    getPosServices("all"),
    getPosProducts("all"),
  ]);

  return { services, products };
};

export const getOrderPayment = async (
  orderId: number | string,
): Promise<OrderPaymentDto> => {
  const response = (await axiosClient.get(
    `/orders/${Number(orderId)}/payment`,
  )) as { data: OrderPaymentDto };

  return response.data;
};

export const getOrderDetail = async (orderId: number | string) => {
  const response = await axiosClient.get(`/orders/${Number(orderId)}`);

  return response.data;
};

export const getOrders = async (
  page = 1,
  limit = 10,
): Promise<OrdersListResponseDto> => {
  const response = (await axiosClient.get("/orders", {
    params: { page, limit },
  })) as { data: OrdersListResponseDto };

  return response.data;
};

export const cancelOrder = async (orderId: number | string) =>
  axiosClient.patch(`/orders/${Number(orderId)}/cancel`);

export const refundOrder = async (orderId: number | string) =>
  axiosClient.patch(`/orders/${Number(orderId)}/refund`);

export const createOrder = async (payload: unknown) =>
  axiosClient.post("/orders", payload);

/* eslint-enable sort-keys */
