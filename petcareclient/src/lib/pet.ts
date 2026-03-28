import axiosClient from "./api";

// ================= TYPES =================

export interface Pet {
  id: number;
  pet_code: string;
  name: string;
  breed: string;
  gender: "MALE" | "FEMALE";
  dob?: string;
  image_url?: string;
  notes?: string;
  status: "ALIVE" | "DECEASED";
  customer_id: number;
  store_id: number;
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
  full_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface ServiceHistory {
  order_id: number;
  created_at: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  status: string;
}

// ================= HELPER =================

const unwrap = <T>(res: any): T => {
  if (res?.data?.data) return res.data.data; 
  if (res?.data) return res.data;           
  return res;
};

// ================= SERVICE =================

class PetService {
  async getPetDetails(petId: number): Promise<PetWithHistory> {
    const res = await axiosClient.get(`/pets/${petId}`);
    return unwrap<PetWithHistory>(res);
  }

  // ===== WEIGHT HISTORY =====
  async getPetWeightHistory(
    petId: number
  ): Promise<PetWeightHistory[]> {
    const res = await axiosClient.get(`/pets/${petId}/weight`);
    const data = unwrap<PetWeightHistory[]>(res);
    return Array.isArray(data) ? data : [];
  }

  // ===== ADD WEIGHT =====
  async addWeightRecord(
    petId: number,
    payload: {
      weight: number;
      recorded_date?: string;
    }
  ): Promise<PetWeightHistory> {
    const res = await axiosClient.post(
      `/pets/${petId}/weight`,
      payload
    );
    return unwrap<PetWeightHistory>(res);
  }

  // ===== UPDATE PET =====
  async updatePet(
    petId: number,
    data: Partial<Pet>
  ): Promise<Pet> {
    const res = await axiosClient.patch(`/pets/${petId}`, data);
    return unwrap<Pet>(res);
  }

  // ===== CUSTOMER =====
  async getCustomerById(customerId: number): Promise<Customer> {
    return {
      id: customerId,
      full_name: "Nguyễn Văn An",
      phone: "0987654321",
      email: "an@gmail.com",
      address: "TP.HCM",
    };
  }

  // ===== SERVICE HISTORY =====
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
  }
}

export const petService = new PetService();