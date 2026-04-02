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
        <h1 className="text-4xl font-bold">Quản lý Thú cưng</h1>

        <p className="text-gray-500">
          Theo dõi hồ sơ và tình trạng sức khỏe của các bé thú cưng
        </p>
      </div>

      <button
        onClick={() => setOpenModal(true)}
        className="bg-orange-400 text-white px-6 py-3 rounded-xl"
      >
        + Thêm Pet Mới
      </button>

      <AddPetModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={onCreated}
      />
    </div>
  );
}
