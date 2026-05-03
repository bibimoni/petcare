import { useQuery } from "@tanstack/react-query";
import { Pencil, PawPrint, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { type Pet, type Customer, type PetWeightHistory } from "@/lib/pets";
import { queryClient } from "@/lib/query-client";

import { getPetProfileData } from "../pets/api/pet-profile.api";
import EditPetModal from "../pets/components/edit-pet-modal";

function Modal({
  open,
  title,
  onClose,
  width = "max-w-lg",
  children,
}: {
  open: boolean;
  title: string;
  width?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={`relative w-full ${width} bg-white rounded-2xl shadow-2xl p-0 max-w-lg mx-auto`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
            onClick={onClose}
            aria-label="Đóng"
            type="button"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface PetProfileDetail extends Pet {
  pet_id?: number;
  avatar_url?: string;
  customer?: Customer & {
    notes?: string;
    customer_id?: number;
    total_spend?: string;
  };
}

type PetWeightWithNotes = PetWeightHistory & {
  notes?: string;
};

export default function PetProfile({ petId }: { petId: number }) {
  const [modalOpen, setModalOpen] = useState<null | "weights" | "services">(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const petQuery = useQuery({
    queryKey: ["pet-profile", petId],
    queryFn: () => getPetProfileData(petId),
    enabled: Number.isFinite(petId),
    staleTime: 5 * 60 * 1000,
  });

  const loading = petQuery.isPending;
  const pet = (petQuery.data?.pet as PetProfileDetail | undefined) ?? null;
  const services = petQuery.data?.services ?? [];
  const weights = useMemo(
    () => (petQuery.data?.weights ?? []) as PetWeightWithNotes[],
    [petQuery.data?.weights],
  );

  const navigate = useNavigate();

  const owner = pet?.customer;
  const ownerId = owner?.customer_id;

  const latestWeight = useMemo(() => {
    if (!weights.length) {
      return "--";
    }

    return `${weights[0].weight} kg`;
  }, [weights]);

  const formatDate = (date?: string) => {
    if (!date) {
      return "--";
    }

    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#f6f1ee]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-2xl border border-orange-100 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-medium text-[#9a6a57]">
              Đang tải hồ sơ thú cưng...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#f6f1ee]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-2xl border border-orange-100 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-medium text-[#9a6a57]">
              Không tìm thấy thú cưng.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const statusLabel =
    pet.status === "ALIVE"
      ? "Khỏe mạnh"
      : pet.status === "DECEASED"
        ? "Bị bệnh"
        : pet.status;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f1ee]">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[#eddcd3] bg-[#fbf6f3] px-6 py-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate("/pets")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#9a6a57] transition hover:bg-[#f3e8e2]"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </button>

            <div className="hidden items-center gap-2 text-sm text-[#9a6a57] md:flex">
              <Link to="/pets" className="hover:underline text-[#9a6a57]">
                Thú cưng
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#67483b]">
                Hồ sơ chi tiết
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e29573]"
              onClick={() => setEditModalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Sửa Hồ Sơ
            </button>
            {/* EditPetModal mới */}
            <EditPetModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              pet={pet}
              onUpdated={async () => {
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: ["pet-profile", petId],
                  }),
                  queryClient.invalidateQueries({ queryKey: ["pets-list"] }),
                ]);
              }}
            />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-[#ead8cf] bg-white p-5 shadow-sm">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={
                    pet.avatar_url ||
                    pet.image_url ||
                    "https://placehold.co/640x480"
                  }
                  alt={pet.name}
                  className="h-56 w-full object-cover"
                />
                <span className="absolute right-3 top-3 rounded-full bg-[#d8f0e6] px-3 py-1 text-xs font-semibold text-[#2d8460]">
                  {statusLabel}
                </span>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#6d4f42]">
                    {pet.gender === "MALE" ? "Đực" : "Cái"}
                  </span>
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#6d4f42]">
                    {pet.dob
                      ? `${new Date().getFullYear() - new Date(pet.dob).getFullYear()} tuổi`
                      : "--"}
                  </span>
                </div>
              </div>

              <h2 className="mt-5 text-center text-2xl font-black text-[#211711]">
                {pet.name}
              </h2>
              <p className="mt-2 flex items-center justify-center gap-1 text-base font-semibold text-orange-600/80">
                <PawPrint className="h-4 w-4" />
                {pet.breed}
              </p>

              <button
                type="button"
                className="mt-6 w-full rounded-2xl border border-[#efdacf] bg-[#fbf5f2] p-4 text-left transition-all hover:cursor-pointer hover:shadow-[0_10px_24px_-12px_rgba(239,170,140,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!ownerId}
                onClick={() => {
                  if (ownerId) {
                    navigate(`/customers/${ownerId}`);
                  }
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#c28d73]">
                  Chủ sở hữu
                </p>
                <p className="mt-1 text-md font-bold text-[#2b1d17]">
                  {owner?.full_name || "Chưa rõ chủ"}
                </p>

                <div className="mt-3 space-y-1 text-sm text-[#805a4a]">
                  <p>Số điện thoại: {owner?.phone || "--"}</p>
                </div>
              </button>

              <div className="mt-4 rounded-2xl border border-[#efdacf] px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#b88a73]">
                  Mã Pet ID
                </p>
                <p className="mt-1 text-sm font-bold text-[#402b22]">
                  {pet.pet_code}
                </p>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="rounded-3xl border border-[#ead8cf] bg-white shadow-sm">
                <div className="flex items-center gap-7 border-b border-[#f0e2da] px-5 py-3 text-sm font-semibold text-[#b88469]">
                  <button type="button" className="text-orange-600/80">
                    Thông tin chung
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="mb-4 text-lg font-black text-[#241811]">
                    Chi tiết hồ sơ
                  </h3>

                  <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-2">
                    <div className="rounded-2xl bg-[#faf3ef] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b78a74]">
                        Ngày sinh
                      </p>
                      <p className="mt-1 text-md font-bold text-[#3a2921]">
                        {formatDate(pet.dob)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf3ef] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b78a74]">
                        Cân nặng hiện tại
                      </p>
                      <p className="mt-1 text-md font-bold text-[#3a2921]">
                        {latestWeight}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf3ef] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b78a74]">
                        Giới tính
                      </p>
                      <p className="mt-1 text-md font-bold text-[#3a2921]">
                        {pet.gender === "MALE" ? "Đực" : "Cái"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf3ef] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b78a74]">
                        Trạng thái
                      </p>
                      <p className="mt-1 text-md font-bold text-[#2f9b64]">
                        {statusLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#faf3ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#b78a74]">
                      Ghi chú
                    </p>
                    <p className="mt-2 text-sm italic text-[#62463a]">
                      {pet.notes || "Chưa có ghi chú"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ead8cf] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#241811]">
                    Tình trạng sức khỏe gần đây
                  </h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-orange-600/80"
                    onClick={() => setModalOpen("weights")}
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[#f1e2d9]">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-[#fcf5f1] text-left text-[#b6856d]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Ngày</th>
                        <th className="px-4 py-3 font-semibold">Loại khám</th>
                        <th className="px-4 py-3 font-semibold">Ghi chú</th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weights.slice(0, 5).map((weight) => (
                        <tr
                          key={weight.id}
                          className="border-t border-[#f1e2d9] text-[#5f453a]"
                        >
                          <td className="px-4 py-3">
                            {formatDate(weight.recorded_date)}
                          </td>
                          <td className="px-4 py-3">Theo dõi cân nặng</td>
                          <td className="px-4 py-3">
                            {weight.notes || "Định kỳ"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="rounded-full bg-[#def4e8] px-3 py-1 text-xs font-semibold text-[#2d9b65]">
                              Hoàn thành
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!weights.length && (
                        <tr>
                          <td
                            className="px-4 py-6 text-center text-sm text-[#a67d6c]"
                            colSpan={4}
                          >
                            Chưa có dữ liệu cân nặng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ead8cf] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#241811]">
                    Lịch sử dịch vụ & Mua hàng
                  </h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-orange-600/80"
                    onClick={() => setModalOpen("services")}
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="space-y-3">
                  {services.slice(0, 5).map((service) => (
                    <div
                      key={service.order_id}
                      className="flex items-center justify-between rounded-2xl border border-[#f1e2d9] bg-[#fffaf8] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#3d2a21]">
                          {service.service_name}
                        </p>
                        <p className="text-sm text-[#ad7f6a]">
                          {service.duration_minutes} phút
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#3d2a21]">
                          {service.price.toLocaleString("vi-VN")}đ
                        </p>
                        <p className="text-sm text-[#ad7f6a]">
                          {formatDate(service.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!services.length && (
                    <div className="rounded-2xl border border-[#f1e2d9] bg-[#fffaf8] px-4 py-6 text-center text-sm text-[#ad7f6a]">
                      Chưa có lịch sử dịch vụ.
                    </div>
                  )}
                </div>
              </div>
              {/* Modal for weights */}
              <Modal
                open={modalOpen === "weights"}
                onClose={() => setModalOpen(null)}
                title="Tất cả tình trạng sức khỏe"
                width="max-w-4xl"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead className="bg-[#fcf5f1] text-left text-[#b6856d]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Ngày</th>
                        <th className="px-4 py-3 font-semibold">Loại khám</th>
                        <th className="px-4 py-3 font-semibold">Ghi chú</th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weights.map((weight) => (
                        <tr
                          key={weight.id}
                          className="border-t border-[#f1e2d9] text-[#5f453a]"
                        >
                          <td className="px-4 py-3">
                            {formatDate(weight.recorded_date)}
                          </td>
                          <td className="px-4 py-3">Theo dõi cân nặng</td>
                          <td className="px-4 py-3">
                            {weight.notes || "Định kỳ"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="rounded-full bg-[#def4e8] px-3 py-1 text-xs font-semibold text-[#2d9b65]">
                              Hoàn thành
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!weights.length && (
                        <tr>
                          <td
                            className="px-4 py-6 text-center text-sm text-[#a67d6c]"
                            colSpan={4}
                          >
                            Chưa có dữ liệu cân nặng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Modal>

              {/* Modal for services */}
              <Modal
                open={modalOpen === "services"}
                onClose={() => setModalOpen(null)}
                title="Tất cả lịch sử dịch vụ & mua hàng"
                width="max-w-4xl"
              >
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.order_id}
                      className="flex items-center justify-between rounded-2xl border border-[#f1e2d9] bg-[#fffaf8] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#3d2a21]">
                          {service.service_name}
                        </p>
                        <p className="text-sm text-[#ad7f6a]">
                          {service.duration_minutes} phút
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#3d2a21]">
                          {service.price.toLocaleString("vi-VN")}đ
                        </p>
                        <p className="text-sm text-[#ad7f6a]">
                          {formatDate(service.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!services.length && (
                    <div className="rounded-2xl border border-[#f1e2d9] bg-[#fffaf8] px-4 py-6 text-center text-sm text-[#ad7f6a]">
                      Chưa có lịch sử dịch vụ.
                    </div>
                  )}
                </div>
              </Modal>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
