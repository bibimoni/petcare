export default function OrderHeader({ order, onClose }: { order: any, onClose?: () => void }) {
  return (
    <div className="px-8 py-5 border-b border-border-color flex items-center justify-between bg-white shrink-0 h-20">
      <div className="flex items-center gap-4">
        <div className="size-11 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100 shadow-sm">
          <span className="material-symbols-outlined text-[24px]">check_circle</span>
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-text-main leading-tight">Chi tiết đơn hàng</h2>
          <div className="flex items-center gap-3 text-sm mt-1">
            <span className="text-text-muted font-medium">
              {/* Dùng ?. để nếu order null cũng không bị sập trang */}
              Mã đơn: <span className="text-text-main font-bold">#{order?.order_id || "..."}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700">
              Hoàn thành
            </span>
          </div>
        </div>
      </div>
      <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}