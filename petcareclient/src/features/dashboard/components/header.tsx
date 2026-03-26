import { useState } from "react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  onQuickAdd?: () => void;
  notificationCount?: number;
  onSearch?: (query: string) => void;
}

export const Header = ({
  onSearch,
  onQuickAdd,
  notificationCount = 1,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 bg-surface-light/80 dark:bg-surface-dark/80 px-8 backdrop-blur-md sticky top-0 z-10">
      {/* Search Bar */}
      <div className="relative w-[40%] group">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">
            search
          </span>
        </div>
        <input
          type="text"
          placeholder="Nhập SĐT, Tên Pet hoặc Mã đơn hàng (VD: 098...)"
          value={searchQuery}
          onChange={handleSearchChange}
          className="block w-full rounded-full border-none bg-gray-100 dark:bg-gray-800 py-3 pl-11 pr-4 text-sm font-medium text-charcoal placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:bg-white dark:focus:bg-gray-900 transition-all shadow-sm"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <Button className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all border border-gray-100 dark:border-gray-700">
          <span className="material-symbols-outlined">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
          )}
        </Button>

        {/* Quick Add Button */}
        <Button
          onClick={onQuickAdd}
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-600/60 px-5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Thêm nhanh</span>
        </Button>
      </div>
    </header>
  );
};
