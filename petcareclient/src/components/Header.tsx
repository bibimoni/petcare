import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  Dog,
  Bell,
  Plus,
  Clock,
  Users,
  Boxes,
  Search,
  Package,
  History,
  BarChart3,
  CalendarX2,
  ShoppingCart,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import type { NotificationItem } from "@/features/notifications/api/notifications.api";

import AddCustomerModal from "@/features/customer/components/add-customer-modal";
import {
  notificationsApi,
  NotificationType,
  NotificationStatus,
} from "@/features/notifications/api/notifications.api";
import { useSearch } from "@/lib/search-context";
import { getSidebarUser } from "@/lib/user";

const DASHBOARD_PAGES = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  { label: "Nhân viên", href: "/employees", icon: <Users size={16} /> },
  { label: "Khách hàng", href: "/customers", icon: <Users size={16} /> },
  { label: "Thú cưng", href: "/pets", icon: <Dog size={16} /> },
  { label: "POS", href: "/pos", icon: <ShoppingCart size={16} /> },
  { label: "Kho", href: "/inventory", icon: <Boxes size={16} /> },
  { label: "Báo cáo", href: "/finance", icon: <BarChart3 size={16} /> },
  {
    label: "Nhật ký hệ thống",
    href: "/audit-logs",
    icon: <History size={16} />,
  },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const { searchQuery, setSearchQuery } = useSearch();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: getSidebarUser,
    staleTime: 5 * 60 * 1000,
  });

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
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
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
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

  const filteredPages = DASHBOARD_PAGES.filter((page) =>
    page.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-6 py-4 border-b border-[#f3ebe7]">
      {/* Cột trái: Search Bar & Actions */}
      <div className="flex items-center gap-6 flex-1 justify-between mr-10">
        <div className="relative hidden lg:block w-96" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a624c]/60 w-5 h-5" />
          <input
            className="w-full bg-[#fcfaf8] border border-[#f3ebe7] rounded-full py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-[#f7b297]/50 text-sm outline-none text-[#1b110d] placeholder:text-[#9a624c]/60 transition-all"
            placeholder={
              isDashboard ? "Tìm kiếm trang..." : "Tìm kiếm nội dung trang..."
            }
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />

          {showSuggestions && searchQuery && isDashboard && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-[#f3ebe7] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                {filteredPages.length > 0 ? (
                  filteredPages.map((page) => (
                    <button
                      key={page.href}
                      onClick={() => {
                        navigate(page.href);
                        setShowSuggestions(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#fcfaf8] rounded-xl transition-all text-sm font-medium text-[#1b110d]"
                    >
                      <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                        {page.icon}
                      </div>
                      {page.label}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#9a624c] font-medium">
                    Không tìm thấy trang phù hợp
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isDashboard && (
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f27a4d] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#e1683b] transition"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Thêm khách hàng</span>
          </button>
        )}
      </div>

      {/* Cột phải: Actions & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 items-center">
          {/* NÚT CHUÔNG THÔNG BÁO */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2.5 rounded-full cursor-pointer hover:bg-[#fcfaf8] text-[#f7b297] font-bold relative transition-colors active:scale-90"
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
                          if (notif.product_id) navigate(`/inventory`);
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
                    className="w-full py-3 cursor-pointer text-xs font-black text-[#f7b297] uppercase tracking-widest hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#f3ebe7] text-center"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-8 w-[1px] bg-[#f3ebe7] mx-2 hidden sm:block"></div>

        {/* Profile Section */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/profile")}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-[#1b110d] group-hover:text-[#f7b297] transition-colors">
              {user?.full_name || "Quản trị viên"}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-[#9a624c] font-black">
              {!user || !user.role?.name
                ? "Người dùng"
                : user.role.name.toUpperCase() === "ADMIN"
                  ? "Chủ cửa hàng"
                  : "Nhân viên"}
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#f7b297] to-[#e09a80] text-white rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-md transition-transform group-active:scale-90">
            {user?.full_name?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>

      <AddCustomerModal
        open={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onCreated={() => {}}
      />
    </header>
  );
};
