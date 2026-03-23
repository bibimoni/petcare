import { Bell } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  return (
    <nav className="h-16 sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Logo />

          <div className="relative w-[520px]">
            <span className="absolute left-4 top-2.5 text-gray-400"></span>

            <Input
              placeholder="Tìm kiếm theo tên pet, ID, SĐT chủ..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          {/* Notification */}
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell size={20} />

            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src="https://i.pravatar.cc/40"
              className="w-9 h-9 rounded-full object-cover"
            />

            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Nguyễn Văn A</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
