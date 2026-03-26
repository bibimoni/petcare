import OwnerInfo from "./owner-info";


export type Pet = {
  id: number;
  name: string;
  breed: string; // Trong ERD là giống loài
  gender: string;
  imageUrl: string;
  // Nếu BE có Join bảng Customer, nó sẽ trả về object như này:
  customer?: {
    fullName: string;
  };
};
export default function PetCard({ pet }: { pet: any }) { // Tạm để any để check data
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <img
        src={pet.imageUrl || "https://via.placeholder.com/150"} // Thêm ảnh mặc định nếu pet chưa có ảnh
        className="w-full h-56 object-cover"
        alt={pet.name}
      />

      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.name}</h3>

        <p className="text-gray-500 text-sm">
          {pet.breed || pet.type} {/* Dự phòng nếu BE trả về breed thay vì type */}
        </p>

        {/* Sửa lại chỗ này để lấy tên chủ từ object customer của BE */}
        <OwnerInfo name={pet.customer?.fullName || "Chưa rõ chủ"} />

        <div className="mt-3 text-xs text-gray-500">
          ID: {pet.id} - Giới tính: {pet.gender === 'MALE' ? 'Đực' : 'Cái'}
        </div>
      </div>
    </div>
  );
}