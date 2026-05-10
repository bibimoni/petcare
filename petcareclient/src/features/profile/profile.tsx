import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export default function ProfilePage() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.success("Đăng xuất thành công");
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#f0e6df] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-3xl font-extrabold text-[#2f231d] mb-8">
              Trang cá nhân
            </h2>
            {user ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a07f6b]">
                    Họ tên
                  </span>
                  <div className="text-lg font-semibold text-[#2f231d]">
                    {user.full_name || user.fullName || "-"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a07f6b]">
                    Email
                  </span>
                  <div className="text-lg font-semibold text-[#2f231d]">
                    {user.email}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a07f6b]">
                    Số điện thoại
                  </span>
                  <div className="text-lg font-semibold text-[#2f231d]">
                    {user.phone || "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[#a07f6b]">
                Không có thông tin người dùng.
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-[#f0e6df]">
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer bg-red-50 text-red-600 hover:bg-red-100 px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
