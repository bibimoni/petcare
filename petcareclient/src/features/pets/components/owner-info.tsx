import { User } from "lucide-react";

type OwnerInfoProps = {
  name: string;
};

export default function OwnerInfo({ name }: OwnerInfoProps) {
  return (
    <div className="mt-4 p-3 rounded-xl border bg-gray-50 flex items-center gap-3">
      {/* Icon */}
      <div className="bg-orange-100 text-orange-500 p-2 rounded-lg">
        <User size={18} />
      </div>

      {/* Text */}
      <div>
        <p className="text-xs text-gray-500">Chủ sở hữu</p>
        <p className="font-semibold text-gray-800">{name}</p>
      </div>
    </div>
  );
}
