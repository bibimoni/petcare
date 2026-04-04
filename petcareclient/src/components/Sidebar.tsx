import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { AvatarBadge } from "@/components/ui/avatar";
import { getSidebarUser } from "@/lib/user";

interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
}

type SidebarUserInfo = {
  email: string;
  phone: string;
  full_name: string;
  role?: {
    id: string;
    name: string;
    store_id: number;
    description: string;
    role_permissions: unknown;
  } | null;
};

interface SidebarProps {
  userInfo?: SidebarUserInfo | Promise<SidebarUserInfo>;
}

const STAFF_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    href: "/dashboard",
  },
  { id: "customers", label: "Khách hàng", icon: "group", href: "/customers" },
  { id: "pets", label: "Thú cưng", icon: "pets", href: "/pets" },
  { id: "inventory", label: "Kho", icon: "inventory_2", href: "/inventory" },
  { id: "pos", label: "POS", icon: "point_of_sale", href: "/pos" },
];

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
  {
    id: "services",
    label: "Dịch vụ",
    icon: "content_cut",
    href: "/services",
  },
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
  const [resolvedUserInfo, setResolvedUserInfo] = useState<SidebarUserInfo>({
    email: "",
    phone: "",
    full_name: "",
    role: null,
  });
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUserInfo = async () => {
      setIsLoadingUserInfo(true);

      if (userInfo) {
        const resolved = await Promise.resolve(userInfo);

        if (isMounted) {
          setResolvedUserInfo(resolved);
          setIsLoadingUserInfo(false);
        }

        return;
      }

      const profile = await getSidebarUser();

      if (isMounted) {
        setResolvedUserInfo(profile);
        setIsLoadingUserInfo(false);
      }
    };

    void loadUserInfo();

    return () => {
      isMounted = false;
    };
  }, [userInfo]);

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.success("Đăng xuất thành công");
    navigate("/login");
  };

  if (isLoadingUserInfo) {
    return (
      <aside className="z-20 hidden w-64 flex-col border-r border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-surface-dark lg:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        </div>
      </aside>
    );
  }

  const roleName = resolvedUserInfo.role?.name?.toUpperCase();
  const navItems =
    roleName === "ADMIN"
      ? DEFAULT_NAV_ITEMS
      : roleName === "STAFF"
        ? STAFF_NAV_ITEMS
        : LIMITED_NAV_ITEMS;

  return (
    <aside className="z-20 hidden w-64 flex-col border-r border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-surface-dark lg:flex">
      <div className="flex h-20 items-center gap-3 px-6">
        <Logo />
      </div>

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

      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
        <button
          className="w-full group cursor-pointer flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Cài đặt</span>
        </button>

        <div className="mt-2 flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 border border-gray-100 dark:border-gray-700/50">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 shrink-0">
            <AvatarBadge />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold text-charcoal dark:text-white">
              {resolvedUserInfo.full_name}
            </p>
            <p className="truncate text-xs text-gray-500">
              {resolvedUserInfo.phone}
            </p>
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
