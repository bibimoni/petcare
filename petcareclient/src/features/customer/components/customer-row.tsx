import { Edit, Trash2, PawPrint } from "lucide-react";

import type { CustomerListItem } from "../api/customer-api";

type CustomerRowProps = {
  c: CustomerListItem;
  onEditCustomer: (customer: CustomerListItem) => void;
};

export default function CustomerRow({ c, onEditCustomer }: CustomerRowProps) {
  const displayName = c.full_name || c.fullName || "Khách hàng";
  const displayId = c.customer_id || c.id || "-";
  const petCount = Array.isArray(c.pets) ? c.pets.length : Number(c.pets || 0);
  const lastVisit = c.last_visit
    ? new Date(c.last_visit).toLocaleDateString("vi-VN")
    : "Chưa phát sinh";

  return (
    <tr className="hover:bg-gray-50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          {c.avatar ? (
            <img
              src={c.avatar_url}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold">
              {displayName[0]}
            </div>
          )}

          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-xs text-gray-500">ID: #{displayId}</p>
          </div>
        </div>
      </td>

      <td className="p-4">{c.phone}</td>

      <td className="p-4 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-600">
          <PawPrint size={14} />
          {petCount}
        </span>
      </td>

      <td className="p-4 text-gray-500">{lastVisit}</td>

      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => onEditCustomer(c)}
          >
            <Edit size={16} />
          </button>

          <button
            type="button"
            className="p-2 hover:bg-red-50 text-red-500 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
