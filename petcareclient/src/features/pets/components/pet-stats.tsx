import { Dog, Cat, Bird, PawPrint } from "lucide-react";

type Pet = {
  type: string;
  status?: string;
};

export default function PetStats({ pets }: { pets: Pet[] }) {
  const total = pets.length;
  const dogs = pets.filter((p) => p.type === "Dog").length;
  const cats = pets.filter((p) => p.type === "Cat").length;
  const treating = pets.filter((p) => p.status === "treating").length;

  const stats = [
    {
      label: "TỔNG SỐ PET",
      value: total,
      icon: PawPrint,
      bg: "bg-orange-50",
      iconColor: "text-orange-200",
    },
    {
      label: "CHÓ",
      value: dogs,
      icon: Dog,
      bg: "bg-blue-50",
      iconColor: "text-blue-200",
    },
    {
      label: "MÈO",
      value: cats,
      icon: Cat,
      bg: "bg-purple-50",
      iconColor: "text-purple-200",
    },
    {
      label: "CHIM",
      value: treating,
      icon: Bird,
      bg: "bg-red-50",
      iconColor: "text-red-200",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
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
