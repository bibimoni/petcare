export default function PetHeader() {
  return (
    <div className="flex justify-between items-center mb-6">

      <div>
        <h1 className="text-4xl font-bold">
          Danh sách Khách hàng
        </h1>

        <p className="text-gray-500">
          Theo dõi hồ sơ khách hàng
        </p>
      </div>

      <button className="bg-orange-400 text-white px-6 py-3 rounded-xl">
        + Thêm Khách hàng mới
      </button>

    </div>
  );
}