import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { Footer } from "../../landing-page/components/footer";
import Breadcrumb from "../components/break-crump";
import PetStats from "../components/pet-stats";
import PetFilters from "../components/pet-filter";
import PetHeader from "../components/pet-header";
import PetList from "../components/pet-list";
import { PetService } from "@/lib/pets";
import { CustomerService } from "@/lib/customers";
import { handleApiError } from "@/lib/api";

type ApiCustomer = {
  [key: string]: unknown;
  customer_id?: number;
  full_name?: string;
};

type UiPet = {
  id: number | string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  imageUrl: string;
  status?: string;
  customer?: {
    fullName: string;
  };
};

let petsRequestPromise: Promise<UiPet[]> | null = null;

const normalizeCustomers = (payload: unknown): ApiCustomer[] => {
  if (Array.isArray(payload)) {
    return payload as ApiCustomer[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseObject = payload as Record<string, unknown>;

  if (Array.isArray(responseObject.data)) {
    return responseObject.data as ApiCustomer[];
  }

  return Object.values(responseObject).filter(
    (item): item is ApiCustomer =>
      !!item && typeof item === "object" && "customer_id" in item,
  );
};

const normalizePetList = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseObject = payload as Record<string, unknown>;

  if (Array.isArray(responseObject.data)) {
    return responseObject.data as Record<string, unknown>[];
  }

  return Object.values(responseObject).filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object",
  );
};

const mapPetToUi = (pet: Record<string, unknown>, ownerName: string): UiPet => {
  const petName = String(pet.name ?? pet.pet_name ?? "Chưa đặt tên");
  const petType = String(
    pet.type ?? pet.species ?? pet.kind ?? pet.breed ?? "Khác",
  );

  console.log("pet", pet);

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
    customer: {
      fullName: ownerName,
    },
  };
};

const fetchAllPetsByCustomers = async (): Promise<UiPet[]> => {
  const customerRes = await CustomerService.getAll();
  const customers = normalizeCustomers(customerRes);
  const customerIds = Array.from(
    new Set(
      customers
        .map((customer) => Number(customer.customer_id))
        .filter((id) => Number.isFinite(id)),
    ),
  );

  const petRequests = await Promise.all(
    customerIds.map(async (customerId) => {
      const customer = customers.find(
        (item) => Number(item.customer_id) === customerId,
      );
      const ownerName = String(customer?.full_name ?? "Chưa rõ chủ");
      const petRes = await PetService.getByCustomer(customerId);
      const rawPets = normalizePetList(petRes);

      return rawPets.map((pet) => mapPetToUi(pet, ownerName));
    }),
  );

  const mergedPets = petRequests.flat();
  const uniquePets = Array.from(
    new Map(mergedPets.map((pet) => [String(pet.id), pet])).values(),
  );

  return uniquePets;
};

export default function PetListPage() {
  const [pets, setPets] = useState<UiPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);

        if (!petsRequestPromise) {
          petsRequestPromise = fetchAllPetsByCustomers();
        }

        const data = await petsRequestPromise;
        setPets(data);
      } catch (err) {
        handleApiError(err);
        petsRequestPromise = null;
      } finally {
        setLoading(false);
      }
    };

    void fetchPets();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center">Đang tải danh sách thú cưng...</div>
    );

  return (
    <>
      <Navbar />
      <div className="bg-[#faf7f5] min-h-screen p-8">
        <Breadcrumb />
        <PetHeader />

        {/* Truyền data thật từ state 'pets' vào các component */}
        <PetStats pets={pets} />
        <PetFilters />
        <PetList pets={pets} />
      </div>
      <Footer />
    </>
  );
}
