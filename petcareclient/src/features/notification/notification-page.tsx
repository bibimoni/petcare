import { useEffect, useState, useCallback } from "react";

import axiosClient from "@/lib/api";
import { sidebarUser } from "@/lib/user";
import { Sidebar } from "@/components/Sidebar";
import { LogoIcon } from "@/components/LogoIcon";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/notifications/user", {
        params: { status: "UNREAD" },
      });
      setNotifications(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar userInfo={sidebarUser} />
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-10 py-6 flex flex-col gap-1 shadow-sm">
          <h1 className="text-xl font-bold text-orange-600/80">
            Lời mời quản trị
          </h1>
          <p className="text-[#bfa08c] text-sm">
            Thông báo các yêu cầu tham gia quản lý
          </p>
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {loading ? (
            <div className="text-[#bfa08c] text-lg">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="text-[#bfa08c] text-lg">Không có lời mời mới</div>
          ) : (
            <>
              {notifications.map((n) => (
                <div
                  key={n.notification_id}
                  className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md flex flex-col items-center mb-8"
                >
                  <div className="flex flex-col items-center mb-6">
                    <LogoIcon />
                    <h2 className="text-xl font-bold text-[#a86a3d] text-center">
                      {n.title || "Lời mời quản trị"}
                    </h2>
                    <div className="text-xs text-[#bfa08c] font-medium mb-2 text-center">
                      {n.type === "STORE_INVITATION"
                        ? "CỬA HÀNG THÚ CƯNG"
                        : n.type}
                    </div>
                  </div>
                  <div className="bg-[#fdf6f0] rounded-xl p-4 w-full flex flex-col items-center mb-6">
                    <div className="text-xs text-[#bfa08c] mb-1">NỘI DUNG</div>
                    <div className="text-[#a86a3d] font-semibold text-center">
                      {n.message}
                    </div>
                    <div className="text-xs text-[#bfa08c] mt-2">
                      Gửi ngày{" "}
                      {new Date(n.created_at).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <div className="flex gap-4 w-full">
                    <a
                      href={n.action_url}
                      className="flex-1 bg-orange-600/80 hover:bg-[#f5a96a] text-white font-bold py-3 rounded-xl transition text-center"
                    >
                      Chấp nhận
                    </a>
                    <button className="flex-1 bg-[#f7ede6] hover:bg-[#f5e0d0] text-[#a86a3d] font-bold py-3 rounded-xl border border-[#f7b17c] transition">
                      Từ chối
                    </button>
                  </div>
                  <div className="text-xs text-orange-600/80 mt-6 text-center">
                    BẠN CÓ {notifications.length} LỜI MỜI MỚI
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
