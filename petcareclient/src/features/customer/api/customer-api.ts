import axiosClient from "@/lib/api";

type CreateCustomerPayload = {
  phone: string;
  notes?: string;
  fullName: string;
  email: string;
  address: string;
};

export const CustomerApi = {
  createCustomer: async (data: CreateCustomerPayload) => {
    const response = await axiosClient.post("/customers", data);
    return response.data;
  },
};
