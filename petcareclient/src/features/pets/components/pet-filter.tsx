export default function PetFilters() {
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
      <div className="flex gap-3">
        <select className="border rounded-full px-4 py-2">
          <option>Tất cả loài</option>
          <option>Dog</option>
          <option>Cat</option>
        </select>

        <select className="border rounded-full px-4 py-2">
          <option>Tình trạng sức khỏe</option>
          <option>Khỏe mạnh</option>
          <option>Đang điều trị</option>
        </select>

        <select className="border rounded-full px-4 py-2">
          <option>Sắp xếp theo</option>
          <option>Tên</option>
          <option>Tuổi</option>
        </select>
      </div>

      <div className="text-sm text-gray-500">Hiển thị 8 trong 124 pet</div>
    </div>
  );
}
