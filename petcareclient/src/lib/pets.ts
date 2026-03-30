import axiosClient from "./api";

type CreatePetPayload = {
  dob: string;
  name: string;
  breed: string;
  notes: string;
  status: string;
  gender: "MALE" | "FEMALE";
};

export interface Pet {
  id: number;
  name: string;
  dob?: string;
  breed: string;
  notes?: string;
  pet_code: string;
  store_id: number;
  image_url?: string;
  customer_id: number;
  gender: "MALE" | "FEMALE";
  status: "ALIVE" | "DECEASED";
}

export interface PetWeightHistory {
  id: number;
  pet_id: number;
  weight: number;
  recorded_date: string;
}

export interface PetWithHistory extends Pet {
  weight_history?: PetWeightHistory[];
}

export interface Customer {
  id: number;
  phone: string;
  email: string;
  address: string;
  full_name: string;
}

export interface ServiceHistory {
  price: number;
  status: string;
  order_id: number;
  created_at: string;
  service_name: string;
  duration_minutes: number;
}

const unwrap = <T>(res: any): T => {
  if (res?.data?.data) return res.data.data;
  if (res?.data) return res.data;
  return res;
};

export const PetService = {
  getByCustomer: async (customerId: number) => {
    const response = await axiosClient.get(`/pets/customer/${customerId}`);
    return response.data;
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

  async getPetDetails(petId: number): Promise<PetWithHistory> {
    const res = await axiosClient.get(`/pets/${petId}`);
    return unwrap<PetWithHistory>(res);
  },

  async getPetWeightHistory(petId: number): Promise<PetWeightHistory[]> {
    const res = await axiosClient.get(`/pets/${petId}/weight`);
    const data = unwrap<PetWeightHistory[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async addWeightRecord(
    petId: number,
    payload: {
      weight: number;
      recorded_date?: string;
    },
  ): Promise<PetWeightHistory> {
    const res = await axiosClient.post(`/pets/${petId}/weight`, payload);
    return unwrap<PetWeightHistory>(res);
  },

  async updatePet(petId: number, data: Partial<Pet>): Promise<Pet> {
    const res = await axiosClient.patch(`/pets/${petId}`, data);
    return unwrap<Pet>(res);
  },

  async getPetServiceHistory(_petId: number): Promise<ServiceHistory[]> {
    return [
      {
        order_id: 1,
        created_at: "2023-10-10",
        service_name: "Tiêm phòng",
        duration_minutes: 30,
        price: 200000,
        status: "COMPLETED",
      },
      {
        order_id: 2,
        created_at: "2023-09-15",
        service_name: "Tẩy giun",
        duration_minutes: 15,
        price: 100000,
        status: "COMPLETED",
      },
    ];
  },
};
