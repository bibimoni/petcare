import axiosClient from "./api";

export const PetService = {
  getByCustomer: async (customerId: number) => {
    return await axiosClient.get(`/pets/customer/${customerId}`);
  },
};