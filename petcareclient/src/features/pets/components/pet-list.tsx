import PetCard from "./pet-card";

type Pet = {
  id: number;
  name: string;
  type: string;
  imageUrl: string;
  ownerName: string;
};

export default function PetList({ pets }: { pets: Pet[] }) {
  return (
    <div className="grid grid-cols-4 gap-6">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}
