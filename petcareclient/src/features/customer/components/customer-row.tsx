import { Edit, Trash2, PawPrint } from "lucide-react";

export default function CustomerRow({ c }: any) {
  return (
    <tr className="hover:bg-gray-50">

      <td className="p-4">
        <div className="flex items-center gap-3">

          {c.avatar ? (
            <img
              src={c.avatar}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold">
              {c.name[0]}
            </div>
          )}

          <div>
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-gray-500">
              ID: #{c.id}
            </p>
          </div>

        </div>
      </td>

      <td className="p-4">{c.phone}</td>

      <td className="p-4 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-600">
          <PawPrint size={14} />
          {c.pets}
        </span>
      </td>

      <td className="p-4 font-semibold">
        {c.total.toLocaleString()}đ
      </td>

      <td className="p-4 text-gray-500">
        {c.date}
      </td>

      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">

          <button className="p-2 hover:bg-gray-100 rounded">
            <Edit size={16} />
          </button>

          <button className="p-2 hover:bg-red-50 text-red-500 rounded">
            <Trash2 size={16} />
          </button>

        </div>
      </td>

    </tr>
  );
}