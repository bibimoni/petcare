import { Search } from "lucide-react";

export default function CustomerToolbar({ search, setSearch }: any) {
  return (
    <div className="flex items-center gap-3">
      {/* SEARCH */}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên / SĐT"
          className="pl-9 pr-3 py-2 border rounded-xl text-sm"
        />
      </div>
    </div>
  );
}
