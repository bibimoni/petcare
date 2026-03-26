import PetCard from "./pet-card";

export default function PetList({ pets }: { pets: any[] }) {
  if (!pets || pets.length === 0) {
    return (
      <div className="text-center p-10 text-gray-500">
        Không tìm thấy thú cưng nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}
