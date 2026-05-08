import {
  Ban,
  Mail,
  Package,
  Loader2,
  CalendarX2,
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

import type { NotificationItem } from "./api/notifications.api";

import {
  notificationsApi,
  NotificationType,
  NotificationStatus,
} from "./api/notifications.api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch dữ liệu
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Không thể tải thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. Logic Đánh dấu 1 thông báo đã đọc
  const handleMarkAsRead = async (notification_id: number) => {
    try {
      await notificationsApi.markAsRead(notification_id);
      // Cập nhật state UI ngay lập tức
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notification_id
            ? { ...n, status: NotificationStatus.READ }
            : n,
        ),
      );
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // 3. Logic Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: NotificationStatus.READ })),
      );
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // 4. Helper render Icon và màu sắc chuẩn xác theo Type của Backend
  const renderNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LOW_STOCK:
        return {
          icon: <AlertTriangle className="text-[#f27a4d] w-6 h-6" />,
          bg: "bg-orange-50",
          border: "border-orange-100",
          actionText: "Quản lý sản phẩm",
        };
      case NotificationType.EXPIRY_WARNING:
      case NotificationType.EXPIRED:
        return {
          icon: <CalendarX2 className="text-[#ba1a1a] w-6 h-6" />,
          bg: "bg-red-50",
          border: "border-red-100",
          actionText: "Quản lý sản phẩm",
        };
      case NotificationType.OUT_OF_STOCK:
        return {
          icon: <Ban className="text-[#9a624c] w-6 h-6" />,
          bg: "bg-[#fcfaf8]",
          border: "border-[#f3ebe7]",
          actionText: "Quản lý sản phẩm",
        };
      case NotificationType.STORE_INVITATION:
        return {
          icon: <Mail className="text-blue-500 w-6 h-6" />,
          bg: "bg-blue-50",
          border: "border-blue-100",
          actionText: "Xem lời mời",
        };
      default:
        return {
          icon: <Package className="text-[#f27a4d] w-6 h-6" />,
          bg: "bg-gray-50",
          border: "border-gray-200",
          actionText: "Chi tiết",
        };
    }
  };

  // Tính số lượng chưa đọc để vô hiệu hóa nút "Đọc tất cả" nếu cần
  const unreadCount = notifications.filter(
    (n) => n.status === NotificationStatus.UNREAD,
  ).length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10 selection:bg-orange-500/30">
        <Header />
        <div className="absolute inset-0 pointer-events-none z-0"></div>

        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#1b110d] mb-2">
                  Thông báo
                </h1>
                <p className="text-[#9a624c] max-w-md text-sm">
                  Cập nhật các cảnh báo thời gian thực về tình trạng kho hàng,
                  lời mời và hoạt động của cửa hàng.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="bg-white border border-[#f3ebe7] px-6 py-3 rounded-xl text-sm font-bold text-[#1b110d] hover:bg-[#f3ebe7] transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck
                    className={`w-5 h-5 ${unreadCount > 0 ? "text-[#f27a4d]" : "text-gray-400"}`}
                  />
                  Đánh dấu đã đọc
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 w-full">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#f27a4d]" />
                </div>
              ) : (
                <div className="space-y-6">
                  <section>
                    <div className="flex items-center gap-3 mb-6 mt-8">
                      <span className="text-[#f27a4d] bg-[#f27a4d]/10 p-2 rounded-lg">
                        <Package className="w-5 h-5" />
                      </span>
                      <h2 className="text-[13px] uppercase tracking-widest font-bold text-[#9a624c]">
                        Tất cả thông báo
                      </h2>
                    </div>

                    <div className="space-y-4 w-full">
                      {notifications.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-[#f3ebe7] text-center text-[#9a624c]">
                          Bạn chưa có thông báo nào.
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const style = renderNotificationStyle(notif.type);
                          const isUnread =
                            notif.status === NotificationStatus.UNREAD;

                          return (
                            <div
                              key={notif.notification_id}
                              className={`rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5 border transition-all shadow-sm w-full ${!isUnread ? "bg-[#fcfaf8]/50 border-[#f3ebe7] opacity-80" : "bg-white border-[#f27a4d]/20 shadow-md"}`}
                            >
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${style.bg} ${style.border}`}
                              >
                                {style.icon}
                              </div>
                              <div className="flex-1 w-full">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-[#1b110d] text-lg flex items-center gap-2">
                                    {notif.title}
                                    {isUnread && (
                                      <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                                    )}
                                  </h4>
                                  <span className="text-[10px] font-semibold text-[#9a624c] bg-[#fcfaf8] px-2 py-1 rounded-md border border-[#f3ebe7]">
                                    {new Date(notif.created_at).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm text-[#9a624c] mb-5">
                                  {notif.message}
                                </p>

                                <div className="flex flex-wrap items-center gap-4">
                                  <button
                                    onClick={() => {
                                      if (
                                        notif.type ===
                                        NotificationType.STORE_INVITATION
                                      ) {
                                        navigate("/invitations");
                                      } else {
                                        navigate("/inventory");
                                      }
                                    }}
                                    className={`text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all ${isUnread ? "text-[#f27a4d]" : "text-[#9a624c]"}`}
                                  >
                                    {style.actionText}{" "}
                                    <ArrowRight className="w-4 h-4" />
                                  </button>

                                  {isUnread && (
                                    <button
                                      onClick={() =>
                                        handleMarkAsRead(notif.notification_id)
                                      }
                                      className="text-[11px] font-bold text-[#9a624c] hover:text-[#1b110d] flex items-center gap-1.5 transition-all bg-[#fcfaf8] px-3 py-1.5 rounded-lg border border-[#f3ebe7] hover:bg-[#f3ebe7]"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Đánh
                                      dấu đã đọc
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
