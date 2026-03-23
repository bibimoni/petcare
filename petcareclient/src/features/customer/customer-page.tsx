import { useState, useEffect } from "react"
import Navbar from "./components/navbar"
import { Footer } from "./components/footer";
import CustomerTabs from "./components/customer-tabs"
import CustomerToolbar from "./components/customer-toolbar"
import CustomerTable from "./components/customer-table"
import { customers } from "./data/mock-customer"
import Breadcrumb from "./components/break-crump";
import CustomerHeader from "./components/customer-header";
import CustomerPagination from "./components/customer-pagination";

export default function CustomersPage() {

  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [sort, setSort] = useState("desc")
  const [page, setPage] = useState(1)

  const limit = 5

  useEffect(() => {
    setPage(1)
  }, [search, tab, sort])

  let filtered = [...customers]

  /* SEARCH */
  filtered = filtered.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  /* FILTER TAB */
  if (tab === "vip") {
    filtered = filtered.filter((c) => c.vip)
  }

  if (tab === "high") {
    filtered = filtered.filter((c) => c.total > 5000000)
  }

  if (tab === "new") {
    filtered = filtered.slice(-5)
  }

  /* SORT */
  filtered.sort((a, b) =>
    sort === "desc"
      ? b.total - a.total
      : a.total - b.total
  )

  const totalPage = Math.ceil(filtered.length / limit)

  const start = (page - 1) * limit

  const paginatedCustomers = filtered.slice(start, start + limit)

  return (
    <>
      <Navbar />

      <div className="bg-[#faf7f5] min-h-screen p-8">

        <Breadcrumb />
        <CustomerHeader />

        <div className="flex-1 p-6 space-y-6">

          <div className="flex justify-between items-center">

            <CustomerTabs
              tab={tab}
              setTab={setTab}
            />

            <CustomerToolbar
              search={search}
              setSearch={setSearch}
              sort={sort}
              setSort={setSort}
            />

          </div>

          <CustomerTable customers={paginatedCustomers} />

          {/* TEXT HIỂN THỊ SỐ LƯỢNG */}
          <div className="flex items-center justify-between mt-4">

            {filtered.length > 0 && (
                <p className="text-sm text-gray-500">
                Hiển thị {start + 1} - {Math.min(start + limit, filtered.length)} / {filtered.length} khách hàng
            </p>
            )}

            <CustomerPagination
              page={page}
              setPage={setPage}
              totalPages={totalPage}
            />

          </div>

        </div>

      </div>

      <Footer />

    </>
  )
}