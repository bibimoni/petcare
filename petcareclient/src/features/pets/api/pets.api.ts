import { CustomerService } from "@/lib/customers";
import { PetService } from "@/lib/pets";

export type PetListItem = {
  name: string;
  type: string;
  breed: string;
  gender: string;
  status?: string;
  imageUrl: string;
  createdAt: string;
  id: number | string;
  customer?: {
    fullName: string;
  };
};

type ApiCustomer = {
  full_name?: string;
  customer_id?: number;
  [key: string]: unknown;
};

const mapPetToUi = (
  pet: Record<string, unknown>,
  ownerName: string,
): PetListItem => {
  const petName = String(pet.name ?? pet.pet_name ?? "Chưa đặt tên");
  const petType = String(
    pet.type ?? pet.species ?? pet.kind ?? pet.breed ?? "Khác",
  );

  return {
    id:
      (pet.pet_id as number | string) ??
      (pet.id as number | string) ??
      `${ownerName}-${petName}`,
    name: petName,
    type: petType,
    breed: String(pet.breed ?? petType),
    gender: String(pet.gender ?? "UNKNOWN"),
    imageUrl: String(pet.avatar_url ?? ""),
    status: String(pet.status ?? ""),
    createdAt: String(pet.created_at ?? new Date().toISOString()),
    customer: {
      fullName: ownerName,
    },
  };
};

export const getPetsForList = async (): Promise<PetListItem[]> => {
  const customerRes = await CustomerService.getAll();
  const customers = customerRes.data as ApiCustomer[];
  const customerIds = Array.from(
    new Set(
      customers
        .map((customer: ApiCustomer) => Number(customer.customer_id))
        .filter((id: number) => Number.isFinite(id)),
    ),
  );

  const petRequests = await Promise.all(
    customerIds.map(async (customerId) => {
      const customer = customers.find(
        (item: ApiCustomer) => Number(item.customer_id) === customerId,
      );
      const ownerName = String(customer?.full_name ?? "Chưa rõ chủ");
      const petRes = await PetService.getByCustomer(customerId as number);

      return (petRes as Record<string, unknown>[]).map((pet) =>
        mapPetToUi(pet, ownerName),
      );
    }),
  );

  const mergedPets = petRequests.flat();
  const uniquePets = Array.from(
    new Map(mergedPets.map((pet) => [String(pet.id), pet])).values(),
  );

  return uniquePets;
};
