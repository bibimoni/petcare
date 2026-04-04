import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Dog, 
  ShoppingCart, 
  Package, 
  BarChart3,
  Store,
  Bell
} from "lucide-react";
import LogoIcon from "@/components/LogoIcon";

// Menu dành cho user đã có Cửa hàng
const STORE_NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Nhân viên",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Khách hàng",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Thú cưng",
    href: "/pets",
    icon: Dog,
  },
  {
    title: "POS",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    title: "Kho",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Báo cáo",
    href: "/reports",
    icon: BarChart3,
  },
];

// Menu dành cho user mới (chưa có cửa hàng)
const NEW_USER_NAV_ITEMS = [
  {
    title: "Tạo cửa hàng",
    href: "/create-store",
    icon: Store,
  },
  {
    title: "Thông báo",
    href: "/notifications",
    icon: Bell,
  },
];

export function Sidebar() {
  const location = useLocation();
  
  // Lấy thông tin user từ localStorage để check store_id
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const hasStore = user && user.store_id !== null && user.store_id !== undefined;

  // Quyết định dùng menu nào
  const currentNavItems = hasStore ? STORE_NAV_ITEMS : NEW_USER_NAV_ITEMS;

  return (
    <aside className="w-64 border-r bg-[#FFFDFB] flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-[#3D261D]">
          <LogoIcon className="w-8 h-8 text-[#FF8A65]" />
          PetCare
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {currentNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#FFF0EB] text-[#FF8A65]"
                    : "text-[#85716B] hover:bg-[#FFF0EB]/50 hover:text-[#FF8A65]"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
