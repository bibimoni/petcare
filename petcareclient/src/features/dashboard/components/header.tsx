import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Mail,
  Settings,
  Package,
  AlertTriangle,
  CalendarX2,
  Ban,
  Clock,
} from "lucide-react";
import {
  notificationsApi,
  NotificationStatus,
  NotificationType,
} from "../../notifications/api/notifications.api";
import type { NotificationItem } from "../../notifications/api/notifications.api";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(
    (n) => n.status === NotificationStatus.UNREAD,
  ).length;

  const renderMiniIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LOW_STOCK:
        return <AlertTriangle className="text-orange-500 w-3.5 h-3.5" />;
      case NotificationType.EXPIRY_WARNING:
      case NotificationType.EXPIRED:
        return <CalendarX2 className="text-red-500 w-3.5 h-3.5" />;
      case NotificationType.OUT_OF_STOCK:
        return <Ban className="text-gray-400 w-3.5 h-3.5" />;
      default:
        return <Package className="text-[#f7b297] w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-6 py-4 border-b border-[#f3ebe7]">
      {/* Cột trái: Search Bar */}
      <div className="flex items-center gap-8 flex-1">
        <div className="relative hidden lg:block w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a624c]/60 w-5 h-5" />
          <input
            className="w-full bg-[#fcfaf8] border border-[#f3ebe7] rounded-full py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-[#f7b297]/50 text-sm outline-none text-[#1b110d] placeholder:text-[#9a624c]/60 transition-all"
            placeholder="Tìm kiếm thông báo, sản phẩm..."
            type="text"
          />
        </div>
      </div>

      {/* Cột phải: Actions & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 items-center">
          <button className="p-2.5 rounded-full hover:bg-[#fcfaf8] text-[#9a624c] transition-colors">
            <Mail className="w-5 h-5" />
          </button>

          {/* NÚT CHUÔNG THÔNG BÁO */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2.5 rounded-full hover:bg-[#fcfaf8] text-[#f7b297] font-bold relative transition-colors active:scale-90"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white shadow-sm"></span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-85 bg-white rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1)] border border-[#f3ebe7] overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <div className="p-4 border-b border-[#f3ebe7] flex justify-between items-center bg-[#fcfaf8]">
                  <div>
                    <h3 className="font-extrabold text-[#1b110d] text-sm">
                      Trung tâm hoạt động
                    </h3>
                    <p className="text-[10px] text-[#9a624c] font-medium uppercase tracking-wider">
                      Cập nhật kho & hệ thống
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#f7b297]/20 text-[#f7b297] px-2 py-0.5 rounded-full font-black">
                      {unreadCount} MỚI
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar bg-white">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.notification_id}
                        className={`p-4 border-b border-[#fcfaf8] cursor-pointer transition-all flex gap-4 items-start ${notif.status === NotificationStatus.UNREAD ? "bg-[#f7b297]/5 hover:bg-[#f7b297]/10" : "bg-white hover:bg-gray-50"}`}
                        onClick={async () => {
                          if (notif.status === NotificationStatus.UNREAD) {
                            await notificationsApi.markAsRead(
                              notif.notification_id,
                            );
                          }
                          setIsNotificationOpen(false);
                          if (notif.product_id)
                            navigate(`/inventory/${notif.product_id}`);
                          else navigate("/notifications");
                        }}
                      >
                        <div className="mt-0.5 p-2 rounded-lg bg-white border border-[#f3ebe7] shadow-sm shrink-0">
                          {renderMiniIcon(notif.type as NotificationType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug truncate ${notif.status === NotificationStatus.UNREAD ? "font-bold text-[#1b110d]" : "font-medium text-[#1b110d]/70"}`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-[#9a624c] line-clamp-1 mt-0.5">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="w-3 h-3 text-[#9a624c]/50" />
                            <span className="text-[10px] font-bold text-[#9a624c]/60">
                              {new Date(notif.created_at).toLocaleTimeString(
                                "vi-VN",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </div>
                        {notif.status === NotificationStatus.UNREAD && (
                          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#f7b297] shrink-0 shadow-[0_0_5px_#f7b297]"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-[#fcfaf8] rounded-full flex items-center justify-center mb-3">
                        <Bell className="w-6 h-6 text-[#d7c2bb]" />
                      </div>
                      <p className="text-xs font-bold text-[#9a624c] uppercase tracking-widest">
                        Hiện không có thông báo
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-2 bg-[#fcfaf8]">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate("/notifications");
                    }}
                    className="w-full py-3 text-xs font-black text-[#f7b297] uppercase tracking-widest hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#f3ebe7] text-center"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="p-2.5 rounded-full hover:bg-[#fcfaf8] text-[#9a624c] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-[#f3ebe7] mx-2 hidden sm:block"></div>

        {/* Profile Section */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-[#1b110d] group-hover:text-[#f7b297] transition-colors">
              {user?.full_name || "Quản trị viên"}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-[#9a624c] font-black">
              {user?.role_id ? "Store Manager" : "Staff"}
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#f7b297] to-[#e09a80] text-white rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-md transition-transform group-active:scale-90">
            {user?.full_name?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
};
