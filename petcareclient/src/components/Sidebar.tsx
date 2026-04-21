import { useQuery } from "@tanstack/react-query";
import { Pin, PinOff, CircleUser } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { queryClient } from "@/lib/query-client";
import { getSidebarUser } from "@/lib/user";

import { LogoIcon } from "./LogoIcon";

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

const isPromiseLikeUserInfo = (
  value: SidebarUserInfo | Promise<SidebarUserInfo> | undefined,
): value is Promise<SidebarUserInfo> => {
  return !!value && typeof value === "object" && "then" in value;
};

const STAFF_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    href: "/dashboard",
  },
  { id: "customers", label: "Khách hàng", icon: "group", href: "/customers" },
  { id: "pets", label: "Thú cưng", icon: "pets", href: "/pets" },
  { id: "pos", label: "POS", icon: "point_of_sale", href: "/pos" },
  { id: "inventory", label: "Kho", icon: "inventory_2", href: "/inventory" },
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
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isValidInitialData =
    userInfo && !isPromiseLikeUserInfo(userInfo) && userInfo.role !== null;

  const userQuery = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: getSidebarUser,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    initialData: isValidInitialData ? userInfo : undefined,
  });

  const resolvedUserInfo: SidebarUserInfo = userQuery.data ?? {
    email: "",
    phone: "",
    full_name: "",
    role: null,
  };
  const isLoadingUserInfo = userQuery.isPending;

  const roleName = resolvedUserInfo.role?.name?.toUpperCase();
  console.log("🚀 ~ Sidebar ~ resolvedUserInfo:", resolvedUserInfo);
  console.log("🚀 ~ Sidebar ~ roleName:", roleName);
  const isAdmin = roleName === "ADMIN";
  const isStaff = roleName === "STAFF";
  const isLimited = !isAdmin && !isStaff;
  const navItems = isAdmin
    ? DEFAULT_NAV_ITEMS
    : isStaff
      ? STAFF_NAV_ITEMS
      : LIMITED_NAV_ITEMS;

  useEffect(() => {
    if (!isLoadingUserInfo && isLimited) {
      const isDefaultEntryPath =
        location.pathname === "/" || location.pathname === "/dashboard";

      if (isDefaultEntryPath) {
        navigate("/create-store", { replace: true });
      }
    }
  }, [isLoadingUserInfo, isLimited, location.pathname, navigate]);

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    queryClient.removeQueries({ queryKey: ["sidebar-user"] });
    toast.success("Đăng xuất thành công");
    navigate("/login");
  };

  const toggleSidebarPin = () => {
    setIsPinned((currentValue) => !currentValue);
  };

  const isExpanded = isPinned || isHovered;
  const isCollapsed = !isExpanded;
  const asideWidthClass = isExpanded ? "w-64" : "w-20";
  const headerPaddingClass = isExpanded ? "px-6" : "px-3";
  const navPaddingClass = isExpanded ? "px-4" : "px-2";
  const navItemLayoutClass = isExpanded ? "px-4" : "justify-center px-0";
  const footerPaddingClass = isExpanded ? "p-4" : "p-3";
  const toggleButtonClass =
    "absolute right-0 top-5 z-10 translate-x-1/2 shrink-0 rounded-sm bg-white p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-charcoal dark:bg-surface-dark dark:hover:bg-gray-800 dark:hover:text-white";

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const pinButtonLabel = isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar";

  if (isLoadingUserInfo) {
    return (
      <aside
        className={`relative z-20 hidden ${asideWidthClass} flex-col border-r border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-surface-dark lg:flex`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          aria-label={pinButtonLabel}
          className={toggleButtonClass}
          onClick={toggleSidebarPin}
          type="button"
        >
          {isPinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </button>

        <div className={`flex h-20 items-center ${headerPaddingClass}`}>
          {isCollapsed ? <LogoIcon /> : <Logo />}
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`relative z-20 hidden ${asideWidthClass} flex-col border-r border-gray-100 bg-white shadow-sm transition-[width] duration-300 dark:border-gray-800 dark:bg-surface-dark lg:flex`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        aria-label={pinButtonLabel}
        className={toggleButtonClass}
        onClick={toggleSidebarPin}
        type="button"
      >
        {isPinned ? (
          <PinOff className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
      </button>

      <div className={`flex h-20 items-center ${headerPaddingClass}`}>
        {isCollapsed ? <LogoIcon /> : <Logo />}
      </div>

      <nav
        className={`flex-1 overflow-y-auto py-4 space-y-2 ${navPaddingClass}`}
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" &&
              location.pathname.startsWith(`${item.href}/`));

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              title={isCollapsed ? item.label : undefined}
              type="button"
              className={`group flex w-full items-center gap-3 rounded-xl cursor-pointer py-3 font-medium transition-all ${navItemLayoutClass} ${
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
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div
        className={`border-t border-gray-100 dark:border-gray-800 ${footerPaddingClass}`}
      >
        <button
          className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl py-3 font-medium text-gray-500 transition-all dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ${navItemLayoutClass}`}
          type="button"
          title={isCollapsed ? "Cài đặt" : undefined}
        >
          <span className="material-symbols-outlined">settings</span>
          {!isCollapsed && <span>Cài đặt</span>}
        </button>

        <div
          className={`mt-2 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700/50 dark:bg-gray-800/50 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
            <CircleUser className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-charcoal dark:text-white">
                  {resolvedUserInfo.full_name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {resolvedUserInfo.phone}
                </p>
              </div>
              <button
                className="cursor-pointer text-gray-400 transition-colors hover:text-charcoal dark:hover:text-white"
                onClick={handleLogout}
                title="Đăng xuất"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  logout
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
