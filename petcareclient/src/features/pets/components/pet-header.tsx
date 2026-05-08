import { Plus } from "lucide-react";
import { useState } from "react";

import AddPetModal from "./add-pet-modal";

type PetHeaderProps = {
  onCreated?: () => Promise<void> | void;
};

export default function PetHeader({ onCreated }: PetHeaderProps) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-black text-[#2f231d]">Quản lý Thú cưng</h1>

        <p className="text-gray-500">
          Theo dõi hồ sơ và tình trạng sức khỏe của các bé thú cưng
        </p>
      </div>

      <button
        onClick={() => setOpenModal(true)}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f27a4d] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#e1683b] transition"
      >
        <Plus size={16} />
        Thêm Pet Mới
      </button>

      <AddPetModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={onCreated}
      />
    </div>
  );
}
