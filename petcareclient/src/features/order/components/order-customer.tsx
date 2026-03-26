export default function OrderCustomer({ customer }: { customer: any }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-border-color shadow-sm">
      <h3 className="text-xs font-bold text-text-muted uppercase mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">person</span>
        Thông tin khách hàng
      </h3>
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
          {customer?.full_name?.charAt(0) || "A"}
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-text-main truncate text-base">{customer?.full_name}</div>
          <div className="text-sm text-text-muted mt-0.5">{customer?.phone}</div>
          <div className="text-xs text-gray-400 mt-1 truncate">{customer?.address}</div>
        </div>
      </div>
    </div>
  );
}