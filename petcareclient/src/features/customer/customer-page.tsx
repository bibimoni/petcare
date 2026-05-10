import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { queryClient } from "@/lib/query-client";
import { useSearch } from "@/lib/search-context";

import { CustomerApi, type CustomerListItem } from "./api/customer-api";
import AddCustomerModal from "./components/add-customer-modal";
import CustomerHeader from "./components/customer-header";
import CustomerPagination from "./components/customer-pagination";
import CustomerTable from "./components/customer-table";
import CustomerTabs from "./components/customer-tabs";
import CustomerToolbar from "./components/customer-toolbar";
import EditCustomerModal from "./components/edit-customer-modal";

export default function CustomersPage() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<
    string | number | null
  >(null);
  const customersQuery = useQuery({
    queryKey: ["customers-list"],
    queryFn: CustomerApi.getCustomers,
    staleTime: 5 * 60 * 1000,
  });

  const customers = customersQuery.data ?? [];
  const loading = customersQuery.isPending;

  const handleEditCustomer = (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDeleteCustomer = (customerId: string | number) => {
    setCustomerToDelete(customerId);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await CustomerApi.deleteCustomer(Number(customerToDelete));
      await queryClient.invalidateQueries({ queryKey: ["customers-list"] });
      toast.success("Xoá khách hàng thành công");
    } catch (_error) {
      toast.error("Không thể xoá khách hàng");
    } finally {
      setCustomerToDelete(null);
    }
  };

  const handleEditModalOpenChange = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setSelectedCustomer(null);
    }
  };

  const limit = 5;

  let filtered = [...customers];

  filtered = filtered.filter(
    (c) =>
      String(c.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      String(c.phone || "").includes(searchQuery),
  );

  if (tab === "new") {
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sort === "desc" ? dateB - dateA : dateA - dateB;
    });
  } else {
    filtered.sort((a, b) =>
      sort === "desc"
        ? Number(b.total_spend || 0) - Number(a.total_spend || 0)
        : Number(a.total_spend || 0) - Number(b.total_spend || 0),
    );
  }

  const totalPage = Math.ceil(filtered.length / limit);
  const currentPage = totalPage > 0 ? Math.min(page, totalPage) : 1;
  const start = (currentPage - 1) * limit;
  const paginatedCustomers = filtered.slice(start, start + limit);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <AddCustomerModal
        open={isAddModalOpen}
        onCreated={async () => {
          await queryClient.invalidateQueries({ queryKey: ["customers-list"] });
        }}
        onOpenChange={setIsAddModalOpen}
      />

      <EditCustomerModal
        open={isEditModalOpen}
        customer={selectedCustomer}
        onUpdated={async () => {
          await queryClient.invalidateQueries({ queryKey: ["customers-list"] });
        }}
        onOpenChange={handleEditModalOpenChange}
      />

      <AlertDialog
        open={!!customerToDelete}
        onOpenChange={(open) => {
          if (!open) setCustomerToDelete(null);
        }}
        title="Xoá khách hàng?"
        description="Bạn có chắc muốn xoá khách hàng này không? Hành động này không thể hoàn tác."
        actionLabel="Xoá"
        cancelLabel="Huỷ"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto bg-[#faf7f5] p-8">
          <div className="mx-auto max-w-7xl flex flex-col gap-8">
            <CustomerHeader onAddCustomer={() => setIsAddModalOpen(true)} />

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
                      search={searchQuery}
                      setSearch={setSearchQuery}
                      sort={sort}
                      setSort={setSort}
                    />
                  </div>

                  <CustomerTable
                    customers={paginatedCustomers}
                    onEditCustomer={handleEditCustomer}
                    onDeleteCustomer={handleDeleteCustomer}
                  />

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
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
