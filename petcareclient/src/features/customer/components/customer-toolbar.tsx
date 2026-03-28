import { Search } from "lucide-react"

export default function CustomerToolbar({
  search,
  setSearch,
  sort,
  setSort
}: any) {

  return (
    <div className="flex items-center gap-3">

      {/* SEARCH */}

      <div className="relative">

        <Search
          size={16}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Tìm tên / SĐT"
          className="pl-9 pr-3 py-2 border rounded-xl text-sm"
        />

      </div>

      {/* SORT */}

      <select
        value={sort}
        onChange={(e) =>
          setSort(e.target.value)
        }
        className="border rounded-xl px-3 py-2 text-sm"
      >

        <option value="desc">
          Chi tiêu cao nhất
        </option>

        <option value="asc">
          Chi tiêu thấp nhất
        </option>

      </select>

    </div>
  )
}