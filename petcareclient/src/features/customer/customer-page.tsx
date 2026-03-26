import { useState, useEffect } from "react";

import { handleApiError } from "@/lib/api";
import { CustomerService } from "@/lib/customers";

import { Sidebar } from "../dashboard/components/sidebar";
import Breadcrumb from "./components/break-crump";
import CustomerHeader from "./components/customer-header";
import CustomerPagination from "./components/customer-pagination";
import CustomerTable from "./components/customer-table";
import CustomerTabs from "./components/customer-tabs";
import CustomerToolbar from "./components/customer-toolbar";
import { Footer } from "./components/footer";

type ApiCustomer = {
  [key: string]: unknown;
  customer_id?: number | string;
  full_name?: string;
  last_visit?: string | null;
  pets?: unknown[];
  phone?: string;
  total_spend?: string | number;
};

const normalizeCustomers = (payload: unknown): ApiCustomer[] => {
  if (Array.isArray(payload)) {
    return payload as ApiCustomer[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseObject = payload as Record<string, unknown>;

  if (Array.isArray(responseObject.data)) {
    return responseObject.data as ApiCustomer[];
  }

  const customers = Object.values(responseObject).filter(
    (item): item is ApiCustomer =>
      !!item && typeof item === "object" && "customer_id" in item,
  );

  return customers;
};

export default function CustomersPage() {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const sidebarUser = {
    email: String(user?.email ?? ""),
    full_name: String(user?.full_name ?? ""),
    phone: String(user?.phone ?? ""),
  };

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await CustomerService.getAll();
        setCustomers(normalizeCustomers(res));
      } catch (err) {
        console.error("Lỗi:", err);
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const limit = 5;

  let filtered = [...customers];

  filtered = filtered.filter(
    (c) =>
      String(c.full_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(c.phone || "").includes(search),
  );

  if (tab === "new") {
    filtered = filtered.slice(-5);
  }

  filtered.sort((a, b) =>
    sort === "desc"
      ? Number(b.total_spend || 0) - Number(a.total_spend || 0)
      : Number(a.total_spend || 0) - Number(b.total_spend || 0),
  );

  const totalPage = Math.ceil(filtered.length / limit);
  const currentPage = totalPage > 0 ? Math.min(page, totalPage) : 1;
  const start = (currentPage - 1) * limit;
  const paginatedCustomers = filtered.slice(start, start + limit);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-[#faf7f5] p-8">
          <Breadcrumb />
          <CustomerHeader />

          <div className="flex-1 p-6 space-y-6">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-orange-300 border-t-orange-500" />
                  <p className="text-lg font-semibold text-gray-700">
                    Đang tải danh sách khách hàng...
                  </p>
                </div>

                <div className="space-y-3">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="h-14 animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <CustomerTabs tab={tab} setTab={setTab} />
                  <CustomerToolbar
                    search={search}
                    setSearch={setSearch}
                    sort={sort}
                    setSort={setSort}
                  />
                </div>

                <CustomerTable customers={paginatedCustomers} />

                <div className="flex items-center justify-between mt-4">
                  {filtered.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Hiển thị {start + 1} -{" "}
                      {Math.min(start + limit, filtered.length)} /{" "}
                      {filtered.length} khách hàng
                    </p>
                  )}
                  <CustomerPagination
                    page={currentPage}
                    setPage={setPage}
                    totalPages={totalPage}
                  />
                </div>
              </>
            )}
          </div>

          <Footer />
        </div>
      </main>
    </div>
  );
}
