import { useQuery } from "@tanstack/react-query";
import {
  Edit,
  Users,
  Search,
  Trash2,
  History,
  PlusCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useSearch } from "@/lib/search-context";
import { getStoredUser } from "@/lib/user";

import {
  getRefInfo,
  getAuditLogs,
  type HistoryEntry,
} from "./api/audit-logs.api";
import { AuditLogDetailModal } from "./components/audit-log-detail-modal";
import { AuditLogTable } from "./components/audit-log-table";

export default function AuditLogsPage() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const storedUser = getStoredUser();
  const storeId = Number(storedUser?.store_id || 0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: entries = [], isPending } = useQuery({
    queryKey: ["audit-logs", storeId],
    queryFn: () => getAuditLogs(),
    staleTime: 5 * 60 * 1000,
    enabled: !!storeId,
  });

  const filteredEntries = useMemo(() => {
    let result = entries;

    // Search filtering
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter((entry) => {
        const ref = getRefInfo(entry);
        return (
          entry.performed_by_name?.toLowerCase().includes(lowerSearch) ||
          entry.action?.toLowerCase().includes(lowerSearch) ||
          ref.id.toString().includes(searchQuery) ||
          ref.type.toLowerCase().includes(lowerSearch) ||
          ref.label.toLowerCase().includes(lowerSearch)
        );
      });
    }

    // Tab filtering
    if (activeTab !== "ALL") {
      result = result.filter((entry) => {
        const ref = getRefInfo(entry);
        return ref.type === activeTab;
      });
    }

    return result;
  }, [entries, searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: entries.length,
      orders: entries.filter((e) => getRefInfo(e).type === "ORDER").length,
      customers: entries.filter((e) => getRefInfo(e).type === "CUSTOMER")
        .length,
      inventory: entries.filter((e) => getRefInfo(e).type === "PRODUCT").length,
      roles: entries.filter((e) => getRefInfo(e).type === "ROLE").length,
    };
  }, [entries]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf7f5]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-charcoal flex items-center gap-3">
                  <History className="text-orange-500" size={32} />
                  Nhật ký hệ thống
                </h1>
                <p className="text-text-secondary mt-1">
                  Kiểm tra và giám sát các hoạt động của nhân viên
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full group-hover:bg-orange-500/10 transition-colors"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
                  Tổng
                </p>
                <p className="text-3xl font-black text-charcoal">
                  {stats.total}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">
                  Giao dịch
                </p>
                <p className="text-3xl font-black text-charcoal">
                  {stats.orders}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-bl-full group-hover:bg-pink-500/10 transition-colors"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-2">
                  Khách hàng
                </p>
                <p className="text-3xl font-black text-charcoal">
                  {stats.customers}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                  Kho hàng
                </p>
                <p className="text-3xl font-black text-charcoal">
                  {stats.inventory}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full group-hover:bg-purple-500/10 transition-colors"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">
                  Quyền hạn
                </p>
                <p className="text-3xl font-black text-charcoal">
                  {stats.roles}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#f3ebe7]">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: "ALL", label: "Tất cả", icon: History },
                  { id: "ORDER", label: "Giao dịch", icon: Trash2 },
                  { id: "CUSTOMER", label: "Khách hàng", icon: Users },
                  { id: "PRODUCT", label: "Kho sản phẩm", icon: Edit },
                  { id: "SERVICE", label: "Dịch vụ", icon: PlusCircle },
                  { id: "ROLE", label: "Quyền hạn", icon: ShieldCheck },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-[300px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhật ký..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden">
              <AuditLogTable
                entries={currentItems}
                isLoading={isPending}
                onViewDetail={(entry) => setSelectedEntry(entry)}
              />

              {/* Pagination UI */}
              {!isPending && filteredEntries.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f3ebe7] p-4 bg-gray-50/30">
                  <p className="shrink-0 text-xs text-[#a07f6b]">
                    Hiển thị{" "}
                    {filteredEntries.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}{" "}
                    - {Math.min(currentPage * pageSize, filteredEntries.length)}{" "}
                    của {filteredEntries.length} hoạt động
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-1 text-sm font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f3ebe7] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {paginationItems.map((item, index) => {
                      if (item === "...") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex h-8 w-8 items-center justify-center text-[#a07f6b]"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item as number)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                            item === currentPage
                              ? "bg-orange-500 text-white shadow-sm"
                              : "text-[#523c30] hover:bg-[#f3ebe7]"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#a07f6b] hover:bg-[#f3ebe7] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </main>

      {selectedEntry && (
        <AuditLogDetailModal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          entry={selectedEntry}
        />
      )}
    </div>
  );
}
