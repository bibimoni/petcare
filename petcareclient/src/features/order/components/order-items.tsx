export default function OrderItems({ items }: { items: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-border-color shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border-color bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          <span className="material-symbols-outlined text-text-muted text-[18px]">shopping_bag</span>
          Sản phẩm & Dịch vụ
        </h3>
        <span className="text-xs font-medium text-text-muted bg-white px-2 py-1 rounded border border-border-color">
          {items?.length || 0} items
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-background-light text-text-muted text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 border-b text-center w-12">#</th>
              <th className="px-6 py-3 border-b">Tên</th>
              <th className="px-6 py-3 border-b text-center w-24">SL</th>
              <th className="px-6 py-3 border-b text-right w-32">Đơn giá</th>
              <th className="px-6 py-3 border-b text-right w-32">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color bg-white">
            {items?.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 text-center text-gray-400 text-xs">{i + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-text-main">
                    {item.product?.name || item.service?.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-medium bg-gray-50/50 group-hover:bg-gray-100/50">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-right text-text-muted">
                  {new Intl.NumberFormat('vi-VN').format(item.unit_price)}đ
                </td>
                <td className="px-6 py-4 text-right font-bold text-text-main">
                  {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}