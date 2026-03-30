import { Link } from "react-router-dom";

import OwnerInfo from "./owner-info";

export type Pet = {
  id: number;
  name: string;
  type?: string;
  breed: string;
  gender: string;
  imageUrl: string;
  customer?: {
    fullName: string;
  };
};
export default function PetCard({ pet }: { pet: Pet }) {
  return (
    <Link
      to={`/pets/${pet.id}`}
      className="block cursor-pointer overflow-hidden rounded-2xl border border-orange-100 bg-white shadow transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_18px_38px_-16px_rgba(249,115,22,0.5)]"
    >
      <img
        src={pet.imageUrl || "https://via.placeholder.com/150"} // Thêm ảnh mặc định nếu pet chưa có ảnh
        className="w-full h-56 object-cover"
        alt={pet.name}
      />

      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.name}</h3>

        <p className="text-gray-500 text-sm">{pet.breed || pet.type}</p>

        <OwnerInfo name={pet.customer?.fullName || "Chưa rõ chủ"} />

        <div className="mt-3 text-xs text-gray-500">
          ID: {pet.id} - Giới tính: {pet.gender === "MALE" ? "Đực" : "Cái"}
        </div>
      </div>
    </Link>
  );
}
