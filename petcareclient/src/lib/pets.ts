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

const unwrap = <T>(res: unknown): T => {
  if (!res || typeof res !== "object") {
    return res as T;
  }

  const response = res as { data?: unknown };

  if (response.data && typeof response.data === "object") {
    const nested = response.data as { data?: unknown };
    if (nested.data !== undefined) {
      return nested.data as T;
    }
  }

  if (response.data !== undefined) {
    return response.data as T;
  }

  return res as T;
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

  async getPetWeightHistory(
    petId: number,
    limit?: number,
  ): Promise<PetWeightHistory[]> {
    const res = await axiosClient.get(`/pets/${petId}/weight`, {
      params: limit && { limit },
    });
    const data = unwrap<PetWeightHistory[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async addWeightRecord(
    petId: number,
    payload: {
      weight: number;
    },
  ): Promise<PetWeightHistory> {
    const res = await axiosClient.post(`/pets/${petId}/weight`, payload);
    return unwrap<PetWeightHistory>(res);
  },

  async updatePet(petId: number, data: Partial<Pet>): Promise<Pet> {
    const res = await axiosClient.patch(`/pets/${petId}`, data);
    return unwrap<Pet>(res);
  },
};
