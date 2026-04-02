import { Dog, Cat, Mars, Venus, PawPrint } from "lucide-react";

type Pet = {
  gender?: string;
  status?: string;
};

export default function PetStats({ pets }: { pets: Pet[] }) {
  const total = pets.length;
  const healthy = pets.filter((p) => p.status === "ALIVE").length;
  const unhealthy = pets.filter((p) => p.status === "DECEASED").length;
  const male = pets.filter((p) => p.gender === "MALE").length;
  const female = pets.filter((p) => p.gender === "FEMALE").length;

  const stats = [
    {
      label: "TỔNG SỐ PET",
      value: total,
      icon: PawPrint,
      bg: "bg-orange-50",
      iconColor: "text-orange-200",
    },
    {
      label: "KHỎE MẠNH",
      value: healthy,
      icon: Dog,
      bg: "bg-blue-50",
      iconColor: "text-blue-200",
    },
    {
      label: "BỊ BỆNH",
      value: unhealthy,
      icon: Cat,
      bg: "bg-purple-50",
      iconColor: "text-purple-200",
    },
    {
      label: "GIỐNG ĐỰC",
      value: male,
      icon: Mars,
      bg: "bg-red-50",
      iconColor: "text-red-200",
    },
    {
      label: "GIỐNG CÁI",
      value: female,
      icon: Venus,
      bg: "bg-pink-50",
      iconColor: "text-pink-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
      {stats.map((s) => {
        const Icon = s.icon;

        return (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-2xl border shadow-sm p-6 ${s.bg}`}
          >
            {/* Icon background */}
            <Icon
              size={80}
              className={`absolute right-4 bottom-4 opacity-40 ${s.iconColor}`}
            />

            {/* Content */}
            <p className="text-sm font-semibold text-gray-500 mb-2">
              {s.label}
            </p>

            <p className="text-4xl font-bold">{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}
