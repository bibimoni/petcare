import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { queryClient } from "@/lib/query-client";
import { useSearch } from "@/lib/search-context";

import { getPetsForList, type PetListItem } from "./api/pets.api";
import PetFilters from "./components/pet-filter";
import PetHeader from "./components/pet-header";
import PetList from "./components/pet-list";
import PetStats from "./components/pet-stats";

export default function PetListPage() {
  const { searchQuery } = useSearch();
  const [breedFilter, setBreedFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nameAsc");
  const petsQuery = useQuery({
    queryKey: ["pets-list"],
    queryFn: getPetsForList,
    staleTime: 5 * 60 * 1000,
  });

  const pets = (petsQuery.data ?? []) as PetListItem[];
  const loading = petsQuery.isPending;

  const handlePetCreated = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pets-list"] });
  };

  let filteredPets = [...pets];

  if (searchQuery) {
    filteredPets = filteredPets.filter((pet) =>
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

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
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto bg-[#faf7f5] p-8">
          <div className="mx-auto max-w-7xl flex flex-col gap-8">
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
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
