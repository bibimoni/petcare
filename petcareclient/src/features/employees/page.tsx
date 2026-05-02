import { useQuery } from "@tanstack/react-query";
import { Lock, Mail, Search, History } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { sidebarUser, getSidebarUser } from "@/lib/user";

import { getStaffList } from "./api/store.api";
import { InviteModal } from "./components/invite-modal";

const EmployeesPage = () => {
  const { data: profile } = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: getSidebarUser,
  });

  const storeId = profile?.store_id || 1;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const { data, isLoading } = useQuery({
    queryKey: ["staff", storeId],
    queryFn: () => getStaffList(storeId),
    enabled: !!profile?.store_id,
  });

  const staff = data?.staff || [];

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm);

      const matchesRole =
        selectedRole === "all" || member.role.name === selectedRole;
      const matchesStatus =
        selectedStatus === "all" || member.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, selectedRole, selectedStatus]);

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-[#f0e6df] bg-[#faf7f5]/90 px-8 py-6 backdrop-blur-sm">
          <div className="flex items-center text-sm font-medium text-[#9f7d67]">
            <Link
              to="/dashboard"
              className="hover:text-[#f27a4d] transition cursor-pointer"
            >
              Dashboard
            </Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">
              chevron_right
            </span>
            <span className="text-[#2f231d] font-bold">Quản lý nhân viên</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#2f231d]">
                Quản lý Nhân viên
              </h1>
              <p className="mt-1 text-sm text-[#9f7d67]">
                Quản lý danh sách và thông tin tài khoản nhân viên.
              </p>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f27a4d] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#e1683b] transition"
            >
              <Mail className="h-4 w-4" />
              Gửi lời mời nhân viên
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 gap-4">
            <div className="relative w-full max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#be9477]">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-[#ecdcd1] bg-[#fdfaf8] py-2.5 pl-11 pr-4 text-sm text-[#523c30] outline-none transition focus:border-[#dcae8c] focus:ring-2 focus:ring-[#f3d8c4]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none rounded-full border border-[#ecdcd1] bg-[#fdfaf8] py-2.5 pl-4 pr-10 text-sm font-medium text-[#523c30] outline-none transition cursor-pointer focus:border-[#dcae8c]"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="STAFF">Nhân viên</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#be9477] text-[18px]">
                  expand_more
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none rounded-full border border-[#ecdcd1] bg-[#fdfaf8] py-2.5 pl-4 pr-10 text-sm font-medium text-[#523c30] outline-none transition cursor-pointer focus:border-[#dcae8c]"
                >
                  <option value="all">Trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Đã khóa</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#be9477] text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="rounded-3xl border border-[#eaded6] bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#f0e3dc] bg-[#fffaf7] text-xs font-bold uppercase tracking-wider text-[#9f7d67]">
                    <th className="px-6 py-4">THÔNG TIN NHÂN VIÊN</th>
                    <th className="px-6 py-4">LIÊN HỆ</th>
                    <th className="px-6 py-4">VAI TRÒ</th>
                    <th className="px-6 py-4">TRẠNG THÁI</th>
                    <th className="px-6 py-4 text-center">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e3dc]">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-[#9f7d67]"
                      >
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : paginatedStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-[#9f7d67]"
                      >
                        Không tìm thấy nhân viên nào
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((member) => (
                      <tr
                        key={member.user_id}
                        className="hover:bg-[#fcfafa] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-[#f0e3dc] bg-[#fdfaf8]">
                              <img
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.full_name}`}
                                alt={member.full_name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-[#2f231d]">
                                {member.full_name}
                              </div>
                              <div className="text-xs text-[#9f7d67]">
                                ID: #{member.user_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[#523c30] font-medium">
                            {member.email}
                          </div>
                          <div className="text-[#9f7d67]">{member.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              member.role.name === "ADMIN"
                                ? "bg-[#e6f2ff] text-[#0066cc]"
                                : "bg-[#f3e6ff] text-[#8800cc]"
                            }`}
                          >
                            {member.role.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${member.status === "ACTIVE" ? "bg-[#2ecf94]" : "bg-red-500"}`}
                            />
                            <span
                              className={`font-semibold ${member.status === "ACTIVE" ? "text-[#1f5a4b]" : "text-red-600"}`}
                            >
                              {member.status === "ACTIVE"
                                ? "Đang hoạt động"
                                : "Đã khóa"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button className="text-[#9f7d67] hover:text-[#523c30] transition cursor-pointer">
                              <Lock className="h-5 w-5" />
                            </button>
                            <button className="text-[#9f7d67] hover:text-[#523c30] transition cursor-pointer">
                              <History className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#f0e3dc] px-6 py-4 bg-white">
              <div className="text-sm text-[#9f7d67]">
                Hiển thị{" "}
                {paginatedStaff.length > 0
                  ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                  : 0}
                -{Math.min(currentPage * ITEMS_PER_PAGE, filteredStaff.length)}{" "}
                trên tổng số {filteredStaff.length} nhân viên
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full cursor-pointer px-4 py-1.5 text-sm font-bold text-[#9f7d67] border border-[#f0e3dc] hover:bg-[#f8f1ec] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 cursor-pointer rounded-full text-sm font-bold transition ${
                      currentPage === i + 1
                        ? "bg-[#f27a4d] text-white"
                        : "text-[#9f7d67] border border-[#f0e3dc] hover:bg-[#f8f1ec]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="rounded-full cursor-pointer px-4 py-1.5 text-sm font-bold text-[#9f7d67] border border-[#f0e3dc] hover:bg-[#f8f1ec] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        storeId={storeId}
      />
    </div>
  );
};

export default EmployeesPage;
