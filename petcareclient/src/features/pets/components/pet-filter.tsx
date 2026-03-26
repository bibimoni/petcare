type Pet = {
  breed?: string;
  status?: string;
};

type PetFiltersProps = {
  breedFilter: string;
  filteredCount: number;
  genderFilter: string;
  pets: Pet[];
  setBreedFilter: (value: string) => void;
  setGenderFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setStatusFilter: (value: string) => void;
  sortBy: string;
  statusFilter: string;
};

export default function PetFilters({
  breedFilter,
  filteredCount,
  genderFilter,
  pets,
  setBreedFilter,
  setGenderFilter,
  setSortBy,
  setStatusFilter,
  sortBy,
  statusFilter,
}: PetFiltersProps) {
  const breedOptions = Array.from(
    new Set(pets.map((pet) => String(pet.breed || "Khác"))),
  );

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
      <div className="flex gap-3">
        <select
          className="border rounded-full px-4 py-2"
          value={breedFilter}
          onChange={(e) => setBreedFilter(e.target.value)}
        >
          <option value="all">Tất cả giống</option>
          {breedOptions.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>

        <select
          className="border rounded-full px-4 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tình trạng sức khỏe</option>
          <option value="ALIVE">Khỏe mạnh</option>
          <option value="DECEASED">Bị bệnh</option>
        </select>

        <select
          className="border rounded-full px-4 py-2"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="all">Giới tính</option>
          <option value="FEMALE">Giống cái</option>
          <option value="MALE">Giống đực</option>
        </select>

        <select
          className="border rounded-full px-4 py-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="nameAsc">Tên A-Z</option>
          <option value="nameDesc">Tên Z-A</option>
        </select>
      </div>

      <div className="text-sm text-gray-500">
        Hiển thị {filteredCount} trong {pets.length} pet
      </div>
    </div>
  );
}
