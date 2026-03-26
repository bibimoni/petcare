export default function OrderSummary({ order }: { order: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
  };

  return (
    <div className="bg-gray-50 border-t border-border-color p-6 space-y-3 mt-auto rounded-b-xl">
      <div className="flex justify-between items-center text-sm">
        <span className="text-text-muted">Tạm tính</span>
        <span className="font-medium text-text-main">{formatCurrency(order?.total_amount)}</span>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-text-muted">Giảm giá</span>
        <span className="font-medium text-green-600">-0đ</span>
      </div>
      
      <div className="h-px bg-border-color my-1"></div>
      
      <div className="flex justify-between items-center pt-1">
        <span className="font-bold text-text-main text-base">Tổng tiền thanh toán</span>
        <span className="font-bold text-2xl text-primary-dark">
          {formatCurrency(order.total_amount)}
        </span>
      </div>
    </div>
  );
}