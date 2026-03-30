import axiosClient from "@/lib/api";

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

export const CustomerApi = {
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
