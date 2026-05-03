import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Sidebar } from "@/components/Sidebar";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { queryClient } from "@/lib/query-client";
import { setStoredUser, getSidebarUser, buildSidebarUser } from "@/lib/user";

import {
  leaveStore,
  deleteStore,
  updateUserProfile,
  getStaffListForStore,
  type UpdateProfilePayload,
} from "./api/settings.api";

const SettingsPage = () => {
  const navigate = useNavigate();

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: getSidebarUser,
  });

  // Fetch staff list to check conditions
  const storeId = profile?.store_id || 0;
  const { data: staffData } = useQuery({
    queryKey: ["staff-list", storeId],
    queryFn: () => getStaffListForStore(storeId),
    enabled: !!storeId,
  });

  // Form state
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (profile?.full_name || profile?.email || profile?.phone) {
      setFormData((prevData) => ({
        full_name: profile.full_name || prevData.full_name || "",
        email: profile.email || prevData.email || "",
        phone: profile.phone || prevData.phone || "",
        address: prevData.address || "",
      }));
    }
  }, [profile]);

  // Mutation for updating profile
  const { mutate: handleUpdateProfile, isPending: isUpdatingProfile } =
    useMutation({
      mutationFn: (data: UpdateProfilePayload) => updateUserProfile(data),
      onSuccess: (response) => {
        const storedUser = setStoredUser({
          full_name: response.full_name,
          email: response.email,
          phone: response.phone,
          address: response.address,
        });
        const sidebarUser = buildSidebarUser(storedUser, storedUser);
        queryClient.setQueryData(["sidebar-user"], sidebarUser);
        toast.success("Cập nhật thông tin thành công");
      },
      onError: () => {
        toast.error("Cập nhật thông tin thất bại, vui lòng thử lại");
      },
    });

  // Mutation for leaving store
  const { mutate: handleLeaveStore, isPending: isLeavingStore } = useMutation({
    mutationFn: () => leaveStore(storeId),
    onSuccess: () => {
      const updatedUser = setStoredUser({
        store_id: null,
        role_id: null,
        role: null,
      });

      const sidebarUser = buildSidebarUser(updatedUser, updatedUser);
      queryClient.setQueryData(["sidebar-user"], sidebarUser);
      toast.success("Bạn đã rời cửa hàng thành công");
      navigate("/create-store");
    },
    onError: () => {
      toast.error("Rời cửa hàng thất bại, vui lòng thử lại");
    },
  });

  // Mutation for deleting store
  const { mutate: handleDeleteStore, isPending: isDeletingStore } = useMutation(
    {
      mutationFn: () => deleteStore(storeId),
      onSuccess: () => {
        const updatedUser = setStoredUser({
          store_id: null,
          role_id: null,
          role: null,
        });

        const sidebarUser = buildSidebarUser(updatedUser, updatedUser);
        queryClient.setQueryData(["sidebar-user"], sidebarUser);
        toast.success("Xoá cửa hàng thành công");
        navigate("/create-store");
      },
      onError: () => {
        toast.error("Xoá cửa hàng thất bại, vui lòng thử lại");
      },
    },
  );

  // Check if user is the last admin in the store
  const isLastAdminInStore = () => {
    if (!staffData?.staff) return false;
    const admins = staffData.staff.filter(
      (staff) => staff.role?.name?.toUpperCase() === "ADMIN",
    );
    return admins.length === 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateProfile(formData);
  };

  const handleLeaveStoreClick = () => {
    setShowLeaveConfirm(true);
  };

  const handleDeleteStoreClick = () => {
    if (!isLastAdminInStore()) {
      toast.error(
        "Bạn chỉ có thể xoá cửa hàng khi là nhân viên cuối cùng trong cửa hàng",
      );
      return;
    }
    setShowDeleteConfirm(true);
  };

  const roleName = profile?.role?.name?.toUpperCase();
  const isAdmin = roleName === "ADMIN";
  const isStaff = roleName === "STAFF";

  if (isLoadingProfile) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center bg-[#faf7f5]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin">
              <span className="material-symbols-outlined text-4xl text-orange-500">
                loading
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-[#f0e6df] bg-[#faf7f5]/90 px-8 py-6 backdrop-blur-sm">
          <div className="flex items-center text-sm font-medium text-[#9f7d67]">
            <span className="text-[#2f231d] font-bold">Cài đặt</span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-[#2f231d]">Cài đặt</h1>
            <p className="text-[#9f7d67] text-sm mt-1">
              Quản lý thông tin cá nhân và cửa hàng của bạn
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8">
            {/* Left Column - Update Profile Form (60-70%) */}
            <div className="col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-[#f0e6df] p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#2f231d]">
                    Cập nhật tài khoản
                  </h2>
                  <p className="text-[#9f7d67] text-sm mt-1">
                    Cập nhật thông tin hồ sơ của bạn
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#1b110d] text-sm font-medium">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.target.value,
                        })
                      }
                      placeholder="Nhập họ và tên"
                      className="w-full rounded-lg border border-[#e7d6cf] px-4 py-2 text-[#1b110d] placeholder:text-[#9a624c] focus:outline-none focus:ring-2 focus:ring-[#ed5012]/20 focus:border-[#ed5012] transition-colors text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#1b110d] text-sm font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Nhập email"
                      className="w-full rounded-lg border border-[#e7d6cf] px-4 py-2 text-[#1b110d] placeholder:text-[#9a624c] focus:outline-none focus:ring-2 focus:ring-[#ed5012]/20 focus:border-[#ed5012] transition-colors text-sm"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#1b110d] text-sm font-medium">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Nhập số điện thoại"
                      className="w-full rounded-lg border border-[#e7d6cf] px-4 py-2 text-[#1b110d] placeholder:text-[#9a624c] focus:outline-none focus:ring-2 focus:ring-[#ed5012]/20 focus:border-[#ed5012] transition-colors text-sm"
                    />
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#1b110d] text-sm font-medium">
                      Địa chỉ
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Nhập địa chỉ"
                      className="w-full rounded-lg border border-[#e7d6cf] px-4 py-2 text-[#1b110d] placeholder:text-[#9a624c] focus:outline-none focus:ring-2 focus:ring-[#ed5012]/20 focus:border-[#ed5012] transition-colors text-sm"
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full bg-[#ed5012] cursor-pointer hover:bg-[#d64311] disabled:bg-[#d0d0d0] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    {isUpdatingProfile
                      ? "Đang cập nhật..."
                      : "Cập nhật thông tin"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Actions & Info (30-40%) */}
            <div className="col-span-1">
              {/* Actions Card */}
              <div className="bg-white rounded-xl shadow-sm border border-[#f0e6df] p-6 mb-6">
                <h3 className="text-lg font-bold text-[#2f231d] mb-4">
                  Hành động
                </h3>

                <div className="space-y-3">
                  {isStaff && (
                    <button
                      type="button"
                      onClick={handleLeaveStoreClick}
                      disabled={isLeavingStore}
                      className="w-full bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 hover:text-red-800 disabled:text-gray-600 font-semibold py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer"
                    >
                      {isLeavingStore ? "Đang xử lý..." : "Rời cửa hàng"}
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDeleteStoreClick}
                      disabled={isDeletingStore}
                      className="w-full bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 hover:text-red-800 disabled:text-gray-600 font-semibold py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer"
                    >
                      {isDeletingStore ? "Đang xử lý..." : "Xoá cửa hàng"}
                    </button>
                  )}
                </div>
              </div>

              {/* Info Card - Leave Store */}
              {isStaff && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">
                    Rời cửa hàng
                  </h4>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Khi bạn rời cửa hàng, bạn sẽ mất quyền truy cập vào tất cả
                    dữ liệu của cửa hàng này. Hành động này không thể hoàn tác.
                  </p>
                </div>
              )}

              {/* Info Card - Delete Store */}
              {isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-900 text-sm mb-2">
                    Xoá cửa hàng
                  </h4>
                  <p className="text-red-700 text-xs leading-relaxed">
                    Bạn chỉ có thể xoá cửa hàng khi là nhân viên cuối cùng. Hành
                    động này sẽ xoá tất cả dữ liệu của cửa hàng và không thể
                    hoàn tác.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Leave Store Confirmation Dialog */}
      <AlertDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Rời cửa hàng"
        description="Bạn có chắc chắn muốn rời cửa hàng? Hành động này không thể hoàn tác."
        actionLabel="Rời cửa hàng"
        cancelLabel="Hủy"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          handleLeaveStore();
        }}
        variant="destructive"
      />

      {/* Delete Store Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Xoá cửa hàng"
        description="Bạn có chắc chắn muốn xoá cửa hàng? Hành động này không thể hoàn tác. Tất cả dữ liệu của cửa hàng sẽ bị xoá."
        actionLabel="Xoá cửa hàng"
        cancelLabel="Hủy"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteStore();
        }}
        variant="destructive"
      />
    </div>
  );
};

export default SettingsPage;
