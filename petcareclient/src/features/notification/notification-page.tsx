import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { LogoIcon } from "@/components/LogoIcon";
import { Sidebar } from "@/components/Sidebar";
import axiosClient from "@/lib/api";
import { sidebarUser } from "@/lib/user";

type NotificationItem = {
  type: string;
  title?: string;
  message: string;
  created_at: string;
  action_url: string;
  notification_id: string;
};

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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
  }, [fetchNotifications]);

  useEffect(() => {
    if (notifications.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > notifications.length - 1) {
      setCurrentIndex(notifications.length - 1);
    }
  }, [notifications, currentIndex]);

  const currentNotification = notifications[currentIndex];

  const handlePrevious = () => {
    if (notifications.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === 0 ? notifications.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    if (notifications.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === notifications.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar userInfo={sidebarUser} />
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-10 py-6 flex items-start justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-orange-600/80">
              Lời mời quản trị
            </h1>
            <p className="text-[#bfa08c] text-sm">
              Thông báo các yêu cầu tham gia quản lý
            </p>
          </div>
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Tải lại thông báo"
            title="Tải lại thông báo"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {loading ? (
            <div className="text-[#bfa08c] text-lg">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="text-[#bfa08c] text-lg">Không có lời mời mới</div>
          ) : (
            <div className="w-full max-w-xl px-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="h-10 w-10 shrink-0 rounded-full border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={notifications.length <= 1}
                  aria-label="Thông báo trước"
                >
                  <ChevronLeft className="mx-auto h-5 w-5" />
                </button>

                <div
                  key={currentNotification.notification_id}
                  className="bg-white rounded-3xl shadow-xl p-10 w-full flex flex-col items-center"
                >
                  <div className="flex flex-col items-center mb-6">
                    <LogoIcon />
                    <h2 className="text-xl font-bold text-[#a86a3d] text-center">
                      {currentNotification.title || "Lời mời quản trị"}
                    </h2>
                    <div className="text-xs text-[#bfa08c] font-medium mb-2 text-center">
                      {currentNotification.type === "STORE_INVITATION"
                        ? "CỬA HÀNG THÚ CƯNG"
                        : currentNotification.type}
                    </div>
                  </div>
                  <div className="bg-[#fdf6f0] rounded-xl p-4 w-full flex flex-col items-center mb-6">
                    <div className="text-xs text-[#bfa08c] mb-1">NỘI DUNG</div>
                    <div className="text-[#a86a3d] font-semibold text-center">
                      {currentNotification.message}
                    </div>
                    <div className="text-xs text-[#bfa08c] mt-2">
                      Gửi ngày{" "}
                      {new Date(
                        currentNotification.created_at,
                      ).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <div className="flex gap-4 w-full">
                    <a
                      href={currentNotification.action_url}
                      className="flex-1 bg-orange-600/80 hover:bg-[#f5a96a] text-white font-bold py-3 rounded-xl transition text-center"
                    >
                      Chấp nhận
                    </a>
                  </div>
                  <div className="text-xs text-orange-600/80 mt-6 text-center">
                    THÔNG BÁO {currentIndex + 1}/{notifications.length}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="h-10 w-10 shrink-0 rounded-full border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={notifications.length <= 1}
                  aria-label="Thông báo tiếp theo"
                >
                  <ChevronRight className="mx-auto h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
