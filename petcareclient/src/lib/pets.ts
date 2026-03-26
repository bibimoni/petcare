import axiosClient from "./api";

type CreatePetPayload = {
  breed: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  name: string;
  notes: string;
  status: string;
};

export const PetService = {
  getByCustomer: async (customerId: number) => {
    return await axiosClient.get(`/pets/customer/${customerId}`);
  },

  createByCustomer: async (customerId: number, payload: CreatePetPayload) => {
    return await axiosClient.post(`/pets/customer/${customerId}`, payload);
  },

  uploadAvatar: async (petId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return await axiosClient.post(`/customers/pets/${petId}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
