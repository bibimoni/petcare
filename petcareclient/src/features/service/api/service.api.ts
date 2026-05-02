import api from "@/lib/api";

export type ServiceCategoryDto = {
  name?: string;
  type?: string;
  status?: string;
  store_id?: number | string;
  description?: string | null;
  category_id: number | string;
};

export type ServiceDto = {
  status?: string;
  combo_name?: string;
  id: number | string;
  price?: number | string;
  image_url?: string | null;
  description?: string | null;
  category_id?: number | string;
  category_name?: string | null;
  min_weight?: number | string | null;
  max_weight?: number | string | null;
};

export type ServicePageData = {
  services: ServiceDto[];
  categories: ServiceCategoryDto[];
};

export type ServiceFilters = {
  search?: string;
  status?: string;
  categoryId?: number | string;
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

const normalizeServiceCategories = (payload: unknown): ServiceCategoryDto[] => {
  return extractList<ServiceCategoryDto>(payload);
};

const normalizeServices = (payload: unknown): ServiceDto[] => {
  return extractList<ServiceDto>(payload);
};

export const getServiceCategories = async (): Promise<ServiceCategoryDto[]> => {
  const response = await api.get("/categories?categoryType=SERVICE");
  return normalizeServiceCategories(response);
};

export const getServices = async (
  filters: ServiceFilters = {},
): Promise<ServiceDto[]> => {
  const response = await api.get("/services", {
    params: {
      search: filters.search,
      category_id: filters.categoryId,
      status: filters.status,
    },
  });
  return normalizeServices(response);
};

export const getServicesByCategoryId = async (
  categoryId: number | string,
): Promise<ServiceDto[]> => {
  return getServices({ categoryId });
};

export const getServicesForTable = async (
  categoryId: string,
): Promise<ServiceDto[]> => {
  if (categoryId === "all") {
    const categories = await getServiceCategories();
    const responses = await Promise.all(
      categories.map((category) =>
        getServices({ categoryId: category.category_id }),
      ),
    );

    return responses.flat();
  }

  return getServicesByCategoryId(categoryId);
};

export const getServicePageData = async (): Promise<ServicePageData> => {
  const categories = await getServiceCategories();

  if (categories.length === 0) {
    return { categories, services: [] };
  }

  const serviceResponses = await Promise.all(
    categories.map((category) =>
      getServices({ categoryId: category.category_id }),
    ),
  );

  return {
    categories,
    services: serviceResponses.flat(),
  };
};
