import { useState, useEffect } from "react";

import { handleApiError } from "@/lib/api";
import { CustomerService } from "@/lib/customers";
import { PetService } from "@/lib/pets";

import { Sidebar } from "../dashboard/components/sidebar";
import { Footer } from "../landing-page/components/footer";
import Breadcrumb from "./components/break-crump";
import PetFilters from "./components/pet-filter";
import PetHeader from "./components/pet-header";
import PetList from "./components/pet-list";
import PetStats from "./components/pet-stats";

type ApiCustomer = {
  full_name?: string;
  customer_id?: number;
  [key: string]: unknown;
};

type UiPet = {
  name: string;
  type: string;
  breed: string;
  gender: string;
  status?: string;
  imageUrl: string;
  id: number | string;
  customer?: {
    fullName: string;
  };
};

let petsRequestPromise: Promise<UiPet[]> | null = null;

const mapPetToUi = (pet: Record<string, unknown>, ownerName: string): UiPet => {
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
    customer: {
      fullName: ownerName,
    },
  };
};

const fetchAllPetsByCustomers = async (): Promise<UiPet[]> => {
  const customerRes = await CustomerService.getAll();
  const customers = customerRes.data;
  const customerIds = Array.from(
    new Set(
      customers
        .map((customer: ApiCustomer) => Number(customer.customer_id))
        .filter((id) => Number.isFinite(id)),
    ),
  );

  const petRequests = await Promise.all(
    customerIds.map(async (customerId) => {
      const customer = customers.find(
        (item: ApiCustomer) => Number(item.customer_id) === customerId,
      );
      const ownerName = String(customer?.full_name ?? "Chưa rõ chủ");
      const petRes = await PetService.getByCustomer(customerId as number);

      return petRes.map((pet) => mapPetToUi(pet, ownerName));
    }),
  );

  const mergedPets = petRequests.flat();
  const uniquePets = Array.from(
    new Map(mergedPets.map((pet) => [String(pet.id), pet])).values(),
  );

  return uniquePets;
};

export default function PetListPage() {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const sidebarUser = {
    email: String(user?.email ?? ""),
    full_name: String(user?.full_name ?? ""),
    phone: String(user?.phone ?? ""),
  };

  const [breedFilter, setBreedFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nameAsc");
  const [pets, setPets] = useState<UiPet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPets = async () => {
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

  const handlePetCreated = async () => {
    petsRequestPromise = null;
    await loadPets();
  };

  useEffect(() => {
    void loadPets();
  }, []);

  let filteredPets = [...pets];

  if (breedFilter !== "all") {
    filteredPets = filteredPets.filter((pet) => pet.breed === breedFilter);
  }

  if (statusFilter !== "all") {
    filteredPets = filteredPets.filter((pet) => pet.status === statusFilter);
  }

  if (genderFilter !== "all") {
    filteredPets = filteredPets.filter((pet) => pet.gender === genderFilter);
  }

  filteredPets.sort((a, b) => {
    if (sortBy === "nameDesc") {
      return b.name.localeCompare(a.name);
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-[#faf7f5] p-8">
          <Breadcrumb />
          <PetHeader onCreated={handlePetCreated} />

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-orange-300 border-t-orange-500" />
                <p className="text-lg font-semibold text-gray-700">
                  Đang tải danh sách thú cưng...
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="h-44 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <PetStats pets={pets} />
              <PetFilters
                breedFilter={breedFilter}
                filteredCount={filteredPets.length}
                genderFilter={genderFilter}
                pets={pets}
                setBreedFilter={setBreedFilter}
                setGenderFilter={setGenderFilter}
                setSortBy={setSortBy}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                statusFilter={statusFilter}
              />
              <PetList pets={filteredPets} />
            </>
          )}
          <Footer />
        </div>
      </main>
    </div>
  );
}
