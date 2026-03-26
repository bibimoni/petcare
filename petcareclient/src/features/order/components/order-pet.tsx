export default function OrderPet({ pet }: { pet: any }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-border-color shadow-sm">
      <h3 className="text-xs font-bold text-text-muted uppercase mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">pets</span>
        Thông tin thú cưng
      </h3>
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-orange-400">pets</span>
        </div>
        <div>
          <div className="font-bold text-text-main text-base">{pet?.name || "N/A"}</div>
          <div className="text-sm text-text-muted mt-0.5">{pet?.breed || "Chưa xác định"}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              {pet?.weight}kg
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              {pet?.gender === 'MALE' ? 'Đực' : 'Cái'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}