import { useEffect, useState } from "react";
import { petService } from "@/lib/pet";
import type { PetWithHistory, Customer, ServiceHistory } from "@/lib/pet";

export default function PetProfile({ petId }: { petId: number }) {
  const [pet, setPet] = useState<PetWithHistory | null>(null);
  const [owner, setOwner] = useState<Customer | null>(null);
  const [services, setServices] = useState<ServiceHistory[]>([]);

  useEffect(() => {
    if (!petId || isNaN(Number(petId))) return;

    const fetchData = async () => {
      const petData = await petService.getPetDetails(petId);
      setPet(petData);

      const ownerData = await petService.getCustomerById(petData.customer_id);
      setOwner(ownerData);

      const serviceData = await petService.getPetServiceHistory(petId);
      setServices(serviceData);
    };

    fetchData();
  }, [petId]);

  const formatDate = (date?: string) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const weightHistory = [...(pet.weight_history || [])].sort(
    (a, b) =>
      new Date(b.recorded_date).getTime() -
      new Date(a.recorded_date).getTime()
  );

  return (
    <div className="bg-background min-h-screen px-10 py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <button className="text-sm text-primary">
          ← Quay lại / Thú cưng /
          <span className="text-foreground font-medium">
            {" "}
            Hồ sơ chi tiết
          </span>
        </button>

        <button className="bg-primary text-white hover:opacity-90 px-5 py-2 rounded-full text-sm font-medium shadow-sm">
          ✏️ Sửa hồ sơ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-7">
        {/* LEFT */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <img
            src={pet.image_url || "https://placehold.co/300x300"}
            className="w-full h-[220px] object-cover rounded-xl"
          />

          <h2 className="text-xl font-semibold mt-4 text-foreground text-center">
            {pet.name}
          </h2>

          <p className="text-primary text-sm mt-1 flex items-center gap-1 text-center justify-center">
            🐾 {pet.breed}
          </p>

          {/* OWNER */}
          {owner && (
            <div className="mt-3 bg-muted border border-border rounded-xl p-4">
              
              <div className="flex items-center text-sm text-left">
                <div className="bg-cover bg-center w-12 h-12 rounded-full" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAslYVWWVdw9SnBU1FHEyrbH7V2T-ODVEAwGHC4xu8P_Dr-IHhsE76mvlKHddhEneQPG6y8A3mC23STZ_S9McIJbyxeUmWVNvJPkmItJRf2tb6Qof_bMIBmdpF0irZUezBgTLFca9PxCQ1P1cSDUkCb2zcqa5VkC69QsuH5zMivn82V9PvDZvX_-b3k2lK8wrqHb2b9ND6ix1FcZqttTA5GeSt6cpXeFPnihmToGXcCt38tVQmswaCiKlFBotO9vNwaEy49fL6Ofajh')` }}>
                </div>
                <div>
                  <p className="text-primary uppercase tracking-wide">
                    CHỦ SỞ HỮU
                  </p>
                  <p className="font-medium text-foreground">
                    {owner.full_name}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-sm text-primary space-y-1">
                <p>📞 {owner.phone}</p>
                <p>✉️ {owner.email}</p>
                <p>📍 {owner.address}</p>
              </div>
            </div>
          )}

          <div className="mt-6 border border-border rounded-xl py-3 text-center text-xs text-primary">
            Pet ID:
            <span className="ml-1 font-semibold text-foreground">
              {pet.pet_code}
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-2 space-y-6">
          {/* DETAILS */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              <span className="text-primary mr-2">•</span>
              Chi tiết hồ sơ
            </h3>

            <div className="grid grid-cols-2 gap-y-5 text-sm">
              <div>
                <p className="text-primary text-sm">
                  NGÀY SINH (DOB)
                </p>
                <p className="font-medium text-foreground mt-1">
                  {formatDate(pet.dob)}
                </p>
              </div>

              <div>
                <p className="text-primary text-sm">GIỚI TÍNH</p>
                <p className="font-medium text-foreground mt-1">
                  {pet.gender}
                </p>
              </div>

              <div>
                <p className="text-primary text-sm">
                  CHỦNG LOẠI (BREED)
                </p>
                <p className="font-medium text-foreground mt-1">
                  {pet.breed}
                </p>
              </div>

              <div>
                <p className="text-primary text-sm">TRẠNG THÁI</p>
                <p className="font-medium text-green-500 mt-1">
                  {pet.status}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-primary text-sm">
                GHI CHÚ (NOTES)
              </p>
              <p className="italic text-foreground mt-1 text-sm">
                {pet.notes}
              </p>
            </div>
          </div>

          {/* WEIGHT */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              <span className="text-primary mr-2">•</span>
              Lịch sử cân nặng
            </h3>

            <table className="w-full text-sm ">
              <thead className="text-primary">
                <tr>
                  <th className="text-left pb-2">Ngày ghi</th>
                  <th className="text-center pb-2">Cân nặng (kg)</th>
                  <th className="text-right pb-2">Thay đổi</th>
                </tr>
              </thead>

              <tbody>
                {weightHistory.map((w, i) => {
                  const prev = weightHistory[i + 1];
                  const diff = prev
                    ? +(w.weight - prev.weight).toFixed(1)
                    : null;

                  return (
                    <tr key={w.id} className="border-t border-border">
                      <td className="py-2">
                        {formatDate(w.recorded_date)}
                      </td>

                      <td className="text-center font-medium text-foreground">
                        {w.weight}
                      </td>

                      <td
                        className={`text-right font-medium ${
                          diff === null
                            ? "text-muted-foreground"
                            : diff > 0
                            ? "text-green-500"
                            : "text-red-400"
                        }`}
                      >
                        {diff === null
                          ? "--"
                          : diff > 0
                          ? `+${diff}`
                          : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SERVICES */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                <span className="text-primary mr-2">•</span>
                Tình trạng sức khỏe gần đây
              </h3>

              <span className="text-sm text-primary cursor-pointer">
                Xem tất cả
              </span>
            </div>

            <table className="w-full text-sm text-center">
              <thead className="text-primary">
                <tr>
                  <th>Thời gian</th>
                  <th>Loại khám</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {services.map((s, i) => (
                  <tr key={i} className="border-t border-border text-center">
                    <td className="py-2">{formatDate(s.created_at)}</td>
                    <td>{s.service_name}</td>
                    <td>{s.duration_minutes} phút</td>

                    <td>
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                        Hoàn thành
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}