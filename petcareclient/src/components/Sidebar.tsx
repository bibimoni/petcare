import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { AvatarBadge } from "@/components/ui/avatar";

interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
}

interface SidebarProps {
  userInfo: {
    email: string;
    phone: string;
    full_name: string;
    role: string | null;
  };
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    href: "/dashboard",
  },
  { id: "employees", label: "Nhân viên", icon: "badge", href: "/employees" },
  { id: "customers", label: "Khách hàng", icon: "group", href: "/customers" },
  { id: "pets", label: "Thú cưng", icon: "pets", href: "/pets" },
  { id: "pos", label: "POS", icon: "point_of_sale", href: "/pos" },
  { id: "inventory", label: "Kho", icon: "inventory_2", href: "/inventory" },
  { id: "reports", label: "Báo cáo", icon: "bar_chart", href: "/reports" },
];

const LIMITED_NAV_ITEMS: NavItem[] = [
  {
    id: "create-store",
    label: "Tạo cửa hàng",
    icon: "store",
    href: "/create-store",
  },
  {
    id: "invitations",
    label: "Lời mời",
    icon: "notifications",
    href: "/invitations",
  },
];

export const Sidebar = ({ userInfo }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.success("Đăng xuất thành công");
    navigate("/login");
  };

  // If role is null, show only limited nav items
  const navItems = !userInfo.role ? LIMITED_NAV_ITEMS : DEFAULT_NAV_ITEMS;

  return (
    <aside className="z-20 hidden w-64 flex-col border-r border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-surface-dark lg:flex">
      {/* Logo Section */}
      <div className="flex h-20 items-center gap-3 px-6">
        <Logo />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" &&
              location.pathname.startsWith(`${item.href}/`));
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              type="button"
              className={`w-full group flex items-center gap-3 rounded-xl cursor-pointer px-4 py-3 font-medium transition-all ${
                isActive
                  ? "bg-orange-100 dark:bg-primary/20 font-bold text-orange-800 dark:text-primary shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-charcoal dark:hover:text-gray-200"
              }`}
            >
              <span
                className={`material-symbols-outlined ${isActive ? "filled" : ""}`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings & User Section */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
        <button
          className="w-full group cursor-pointer flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Cài đặt</span>
        </button>

        {/* User Card */}
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 border border-gray-100 dark:border-gray-700/50">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 shrink-0">
            <AvatarBadge />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold text-charcoal dark:text-white">
              {userInfo.full_name}
            </p>
            <p className="truncate text-xs text-gray-500">{userInfo.phone}</p>
          </div>
          <button
            className="text-gray-400 hover:text-charcoal cursor-pointer dark:hover:text-white transition-colors"
            onClick={handleLogout}
            title="Đăng xuất"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
