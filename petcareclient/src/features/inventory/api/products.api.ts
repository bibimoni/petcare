import api from "@/lib/api";

export type CategoryDto = {
  name?: string;
  type?: string;
  status?: string;
  store_id?: number | string;
  description?: string | null;
  category_id: number | string;
};

export type ProductDto = {
  name?: string;
  status?: string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  store_id?: number | string;
  product_id: number | string;
  description?: string | null;
  expiry_date?: string | null;
  cost_price?: number | string;
  sell_price?: number | string;
  category_id?: number | string;
};

const extractList = <T extends Record<string, unknown>>(
  payload: unknown,
): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseObject = payload as {
    data?: unknown;
  };

  if (Array.isArray(responseObject.data)) {
    return responseObject.data as T[];
  }

  if (responseObject.data && typeof responseObject.data === "object") {
    const nestedData = (responseObject.data as { data?: unknown }).data;
    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }
  }

  return [];
};

const normalizeCategories = (payload: unknown): CategoryDto[] => {
  return extractList<CategoryDto>(payload);
};

const normalizeProducts = (payload: unknown): ProductDto[] => {
  return extractList<ProductDto>(payload);
};

export const getProductCategories = async (): Promise<CategoryDto[]> => {
  const response = await api.get("/categories?type=PRODUCT");
  return normalizeCategories(response);
};

export const getProductsByCategoryId = async (
  categoryId: number | string,
): Promise<ProductDto[]> => {
  const response = await api.get(`/products/category/${categoryId}`);
  return normalizeProducts(response);
};

export const getProductsForTable = async (
  categoryId: string,
): Promise<ProductDto[]> => {
  if (categoryId === "all") {
    const categories = await getProductCategories();
    const responses = await Promise.all(
      categories.map((category) =>
        getProductsByCategoryId(category.category_id),
      ),
    );

    return responses.flat();
  }

  return getProductsByCategoryId(categoryId);
};
