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

import { toNumber, formatPrice } from "../utils";

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
    return {
      icon: "shower",
      iconTone: "bg-[#e0f2f1] text-[#1b7b79]",
    };
  }

  if (name.includes("cắt") || name.includes("tỉa")) {
    return {
      icon: "content_cut",
      iconTone: "bg-[#fde8de] text-[#c36d47]",
    };
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
    return {
      icon: "home",
      iconTone: "bg-[#e9f3eb] text-[#5e8f68]",
    };
  }

  return {
    icon: "pets",
    iconTone: "bg-[#f3ebe7] text-[#8b6955]",
  };
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

const mapServiceDto = (service: ServiceDto, index: number): PosService => {
  const serviceName = String(service.combo_name ?? "Dịch vụ");
  const iconMeta = getServiceIconMeta(serviceName);
  const rawPrice = parseNumber(service.price);

  return {
    id: parseNumber(service.id) || index + 1,
    name: serviceName,
    icon: iconMeta.icon,
    price: formatPrice(service.price),
    rawPrice,
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
    id: parseNumber(product.product_id) || index + 1,
    name: String(product.name ?? "Sản phẩm"),
    description:
      typeof product.description === "string" && product.description.trim()
        ? product.description
        : "Sản phẩm cho thú cưng",
    price: formatPrice(product.sell_price),
    stock: parseNumber(product.stock_quantity),
    image,
  };
};

export const getPosServiceCategories = async (): Promise<
  ServiceCategoryDto[]
> => {
  return getServiceCategories();
};

export const getPosProductCategories = async (): Promise<CategoryDto[]> => {
  return getProductCategories();
};

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

  return {
    services,
    products,
  };
};
