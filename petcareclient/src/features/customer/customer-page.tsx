import { CustomerService } from "@/lib/customers"; // Chú ý đường dẫn import
import { handleApiError } from "@/lib/api"; // Để hiện toast thông báo lỗi
import { useState, useEffect } from "react" 
import { Footer } from "./components/footer";
import Navbar from "./components/navbar"
import CustomerTabs from "./components/customer-tabs"
import CustomerToolbar from "./components/customer-toolbar"
import CustomerTable from "./components/customer-table"
import Breadcrumb from "./components/break-crump";
import CustomerHeader from "./components/customer-header";
import CustomerPagination from "./components/customer-pagination";

export default function CustomersPage() {

  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [sort, setSort] = useState("desc")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true); 
  const [customers, setCustomers] = useState([])



const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await CustomerService.getAll();
      
      // Kiểm tra xem res trả về mảng hay object chứa mảng
      // Vì Interceptor của bạn trả về thẳng response.data, nên thường res là mảng
      setCustomers(Array.isArray(res) ? res : res.data || []);
      
    } catch (err) {
      console.error("Lỗi:", err);
      handleApiError(err); // Hiện thông báo lỗi lên màn hình (như Token hết hạn)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);
  // paging
  const limit = 5

  useEffect(() => {
    setPage(1)
  }, [search, tab, sort])

  let filtered = [...customers]

  /* SEARCH */
  filtered = filtered.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  /* FILTER TAB */
  // if (tab === "vip") {
  //   filtered = filtered.filter((c) => c.vip)
  // }

  // if (tab === "high") {
  //   filtered = filtered.filter((c) => c.total_spend > 5000000)
  // }

  if (tab === "new") {
    filtered = filtered.slice(-5)
  }

  /* SORT */
  // filtered.sort((a, b) =>
  //   sort === "desc"
  //     ? b.total - a.total
  //     : a.total - b.total
  // )
  filtered.sort((a, b) => a.full_name.localeCompare(b.full_name))

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

