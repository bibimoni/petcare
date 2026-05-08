import { Plus } from "lucide-react";

type CustomerHeaderProps = {
  onAddCustomer: () => void;
};

export default function CustomerHeader({ onAddCustomer }: CustomerHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-black text-[#2f231d]">
          Danh sách khách hàng
        </h1>

        <p className="text-gray-500">Theo dõi hồ sơ khách hàng</p>
      </div>

      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f27a4d] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#e1683b] transition"
        onClick={onAddCustomer}
      >
        <Plus size={16} />
        Thêm Khách hàng mới
      </button>
    </div>
  );
}
