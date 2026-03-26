interface FooterProps {
  version?: string;
  lastSyncTime?: string;
  supportPhone?: string;
}

export const Footer = ({
  lastSyncTime = "10:45 AM",
  version = "2.4.0",
  supportPhone = "1900 6868",
}: FooterProps) => {
  const syncTimeText = lastSyncTime;

  return (
    <footer className="mt-auto flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-6 text-sm text-gray-400">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-green-500">
          cloud_done
        </span>
        <span>Dữ liệu đã đồng bộ lúc {syncTimeText}</span>
      </div>
      <div className="flex items-center gap-6">
        <span>Phiên bản {version}</span>
        <a
          href={`tel:${supportPhone}`}
          className="flex items-center gap-1 text-primary cursor-pointer hover:underline transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            support_agent
          </span>
          <span>Hotline: {supportPhone}</span>
        </a>
      </div>
    </footer>
  );
};
