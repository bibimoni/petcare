import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { getAuditLogs, type ActivityItem } from "./api/audit-logs.api";
import { AuditLogTable } from "./components/audit-log-table";
import { AuditLogDetailModal } from "./components/audit-log-detail-modal";
import { getStoredUser } from "@/lib/user";
import { Search, History, Trash2, Edit, PlusCircle, ShieldCheck } from "lucide-react";

export default function AuditLogsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<string>("ALL");
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const storedUser = getStoredUser();
    const storeId = Number(storedUser?.store_id || 0);

    const { data: activities = [], isPending } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: () => getAuditLogs(100),
        staleTime: 5 * 60 * 1000,
    });

    const filteredActivities = useMemo(() => {
        return activities.filter((activity) => {
            const matchesSearch =
                activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.reference_id.toString().includes(searchTerm) ||
                activity.type.toLowerCase().includes(searchTerm.toLowerCase());

            if (activeTab === "ALL") return matchesSearch;
            if (activeTab === "ORDER") return matchesSearch && activity.reference_type === "ORDER";
            if (activeTab === "PRODUCT") return matchesSearch && activity.reference_type === "PRODUCT";
            if (activeTab === "SERVICE") return matchesSearch && activity.reference_type === "SERVICE";
            if (activeTab === "ROLE") return matchesSearch && activity.reference_type === "ROLE";

            return matchesSearch;
        });
    }, [activities, searchTerm, activeTab]);

    const stats = useMemo(() => {
        return {
            total: activities.length,
            orders: activities.filter(a => a.reference_type === "ORDER").length,
            inventory: activities.filter(a => a.reference_type === "PRODUCT").length,
            roles: activities.filter(a => a.reference_type === "ROLE").length,
        };
    }, [activities]);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal flex items-center gap-3">
                                <History className="text-orange-500" size={32} />
                                Nhật ký hệ thống
                            </h1>
                            <p className="text-text-secondary mt-1">
                                Kiểm tra và giám sát các hoạt động nhạy cảm của nhân viên
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full group-hover:bg-orange-500/10 transition-colors"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Tổng hoạt động</p>
                            <p className="text-3xl font-black text-charcoal">{stats.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Hủy đơn / Giao dịch</p>
                            <p className="text-3xl font-black text-charcoal">{stats.orders}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Thay đổi tồn kho</p>
                            <p className="text-3xl font-black text-charcoal">{stats.inventory}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full group-hover:bg-purple-500/10 transition-colors"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">Thay đổi quyền hạn</p>
                            <p className="text-3xl font-black text-charcoal">{stats.roles}</p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#f3ebe7]">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            {[
                                { id: "ALL", label: "Tất cả", icon: History },
                                { id: "ORDER", label: "Hủy đơn", icon: Trash2 },
                                { id: "PRODUCT", label: "Tồn kho", icon: Edit },
                                { id: "SERVICE", label: "Dịch vụ", icon: PlusCircle },
                                { id: "ROLE", label: "Quyền hạn", icon: ShieldCheck },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhật ký..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <AuditLogTable
                        activities={filteredActivities}
                        isLoading={isPending}
                        onViewDetail={(activity) => setSelectedActivity(activity)}
                    />
                </div>
            </main>

            {selectedActivity && (
                <AuditLogDetailModal
                    isOpen={!!selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    referenceId={selectedActivity.reference_id}
                    referenceType={selectedActivity.reference_type}
                    storeId={storeId}
                />
            )}
        </div>
    );
}
