import OwnerInfo from "./owner-info";


type Pet = {
  id: number;
  name: string;
  type: string;
  ownerName: string;
  imageUrl: string;
};

export default function PetCard({ pet }: { pet: Pet }) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <img
        src={pet.imageUrl}
        className="w-full h-56 object-cover"
      />

      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.name}</h3>

        <p className="text-gray-500 text-sm">
          {pet.type}
        </p>

        <OwnerInfo name={pet.ownerName} />

        <div className="mt-3 text-xs text-gray-500">
          ID: {pet.id}
        </div>
      </div>
    </div>
  );
}