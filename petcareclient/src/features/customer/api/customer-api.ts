import axiosClient from "@/lib/api";

export type CustomerListItem = {
  phone?: string;
  notes?: string;
  email?: string;
  pets?: unknown[];
  address?: string;
  fullName?: string;
  full_name?: string;
  avatar_url?: string;
  id?: number | string;
  [key: string]: unknown;
  created_at: Date | string;
  updated_at: Date | string;
  last_visit?: string | null;
  customer_id?: number | string;
  total_spend?: string | number;
};

type CreateCustomerPayload = {
  email: string;
  phone: string;
  notes?: string;
  address: string;
  fullName: string;
};

type UpdateCustomerPayload = {
  id: string;
  email?: string;
  notes?: string;
  phone?: string;
  address?: string;
  fullName?: string;
};

const normalizeCustomers = (payload: unknown): CustomerListItem[] => {
  if (Array.isArray(payload)) {
    return payload as CustomerListItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseObject = payload as Record<string, unknown>;

  if (Array.isArray(responseObject.data)) {
    return responseObject.data as CustomerListItem[];
  }

  const customers = Object.values(responseObject).filter(
    (item): item is CustomerListItem =>
      !!item && typeof item === "object" && "customer_id" in item,
  );

  return customers;
};

export const CustomerApi = {
  getCustomers: async () => {
    const response = await axiosClient.get("/customers");
    return normalizeCustomers(response.data ?? response);
  },

  createCustomer: async (data: CreateCustomerPayload) => {
    const response = await axiosClient.post("/customers", data);
    return response.data;
  },

  editCustomer: async (data: UpdateCustomerPayload) => {
    const response = await axiosClient.patch(`/customers/${data.id}`, {
      ...data,
    });
    return response.data;
  },
};
