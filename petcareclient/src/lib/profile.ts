import axiosClient from "./api";

export interface Customer {
  phone: string;
  email: string;
  notes?: string;
  address: string;
  store_id: number;
  full_name: string;
  created_at: string;
  avatar_url?: string;
  customer_id: number;
  updated_at?: string;
  deleted_at?: string | null;
  last_visit?: string | null;
  total_spend?: string | number;
}

export interface Pet {
  age?: number;
  breed: string;
  pet_id: number;
  species: string;
  weight?: number;
  pet_name: string;
  avatar_url?: string;
}

export interface OrderDetail {
  id: number;
  name: string;
  quantity: number;
  subtotal: number;
  pet_name?: string;
  unit_price: number;
  item_type: "PRODUCT" | "SERVICE";
}

export interface Order {
  status: string;
  order_id: number;
  created_at: string;
  total_amount: number;
  order_details: OrderDetail[];
}

class ProfileService {
  async getCustomerById(customerId: number): Promise<Customer> {
    try {
      const response = await axiosClient.get(`/customers/${customerId}`);
      return (response.data || response) as unknown as Customer;
    } catch (error) {
      console.error("Error fetching customer by id:", error);
      throw error;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer> {
    try {
      const response = await axiosClient.get(`/customers/phone/${phone}`);
      return (response.data || response) as unknown as Customer;
    } catch (error) {
      console.error("Error fetching customer by phone:", error);
      throw error;
    }
  }

  async updateCustomer(
    customerId: number,
    data: Partial<Customer>,
  ): Promise<Customer> {
    try {
      const response = await axiosClient.patch(
        `/customers/${customerId}`,
        data,
      );
      return (response.data || response) as unknown as Customer;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  }

  async getPetsByCustomer(customerId: number): Promise<Pet[]> {
    try {
      const response = await axiosClient.get(`/pets/customer/${customerId}`);

      const convertToArray = (data: any): any[] => {
        if (!data) return [];

        if (Array.isArray(data)) {
          return data;
        }

        if (typeof data === "object") {
          const values = Object.values(data);
          const filtered = values.filter(
            (item: any) =>
              item && typeof item === "object" && (item.pet_id || item.id),
          );

          if (filtered.length > 0) {
            return filtered;
          }
        }

        return [];
      };

      let petsArray: any[] = [];

      if (response && typeof response === "object") {
        if ("data" in response && response.data) {
          petsArray = convertToArray(response.data);
        } else {
          petsArray = convertToArray(response);
        }
      }

      const pets: Pet[] = petsArray.map((item: any) => ({
        pet_id: item.pet_id || item.id,
        pet_name: item.name || item.pet_name,
        breed: item.breed || "",
        species:
          item.species ||
          (item.breed?.toLowerCase().includes("chó") ? "DOG" : "CAT"),
        age: item.age,
        weight: item.weight,
        avatar_url: item.avatar_url,
      }));

      return pets;
    } catch (error) {
      console.error("Error fetching pets:", error);
      return [];
    }
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    try {
      const response = await axiosClient.get(`/orders/customer/${customerId}`);

      const convertToArray = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;

        if (typeof data === "object") {
          const values = Object.values(data);

          const filtered = values.filter(
            (item: any) => item && typeof item === "object" && item.order_id,
          );

          if (filtered.length > 0) {
            return filtered;
          }
        }

        return [];
      };

      let ordersArray: any[] = [];

      if (response && typeof response === "object") {
        if ("data" in response && response.data) {
          ordersArray = convertToArray(response.data);
        } else {
          ordersArray = convertToArray(response);
        }
      }

      const orders: Order[] = ordersArray.map((item: any) => ({
        order_id: item.order_id,
        created_at: item.created_at,
        total_amount: Number(item.total_amount),
        status: item.status,
        order_details: (item.order_details || []).map((detail: any) => ({
          id: detail.id,
          item_type: detail.item_type,
          name:
            detail.name ||
            detail.product?.name ||
            detail.service?.name ||
            "Sản phẩm",
          quantity: detail.quantity,
          unit_price: Number(detail.unit_price),
          subtotal: Number(detail.subtotal),
          pet_name: detail.pet?.name,
        })),
      }));

      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }

  async createPet(customerId: number, petData: Partial<Pet>): Promise<Pet> {
    try {
      const response = await axiosClient.post(
        `/pets/customer/${customerId}`,
        petData,
      );
      return response as unknown as Pet;
    } catch (error) {
      console.error("Error creating pet:", error);
      throw error;
    }
  }

  async updatePet(petId: number, petData: Partial<Pet>): Promise<Pet> {
    try {
      const response = await axiosClient.patch(`/pets/${petId}`, petData);
      return response as unknown as Pet;
    } catch (error) {
      console.error("Error updating pet:", error);
      throw error;
    }
  }

  async deletePet(petId: number): Promise<void> {
    try {
      await axiosClient.delete(`/pets/${petId}`);
    } catch (error) {
      console.error("Error deleting pet:", error);
      throw error;
    }
  }

  async getPetDetails(petId: number): Promise<Pet> {
    try {
      const response = await axiosClient.get(`/pets/${petId}`);
      return response as unknown as Pet;
    } catch (error) {
      console.error("Error fetching pet details:", error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
