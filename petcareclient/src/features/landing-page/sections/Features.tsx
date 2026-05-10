import { Users, Package } from "lucide-react";
import { FaCashRegister } from "react-icons/fa6";

const colorMap: Record<string, { bg: string; text: string }> = {
  "blue-500": { bg: "bg-blue-500/20", text: "text-blue-500" },
  "green-500": { bg: "bg-green-500/20", text: "text-green-500" },
  "purple-500": { bg: "bg-purple-500/20", text: "text-purple-500" },
};

const features = [
  {
    icon: Users,
    color: "blue-500",
    title: "Quản lý khách hàng",
    description:
      "Lưu trữ hồ sơ chi tiết của từng bé và sở thích đặc biệt. Chăm sóc khách hàng tự động qua SMS/Zalo.",
  },
  {
    icon: FaCashRegister,
    color: "green-500",
    title: "POS bán hàng",
    description:
      "Giao diện bán hàng trực quan, hỗ trợ màn hình cảm ứng. Tính tiền nhanh chóng, tích hợp máy in hóa đơn, máy quét mã vạch và thanh toán QR.",
  },
  {
    icon: Package,
    color: "purple-500",
    title: "Quản lý kho thông minh",
    description:
      "Theo dõi số lượng hàng tồn kho theo thời gian thực. Cảnh báo tự động khi sắp hết hàng hoặc hàng sắp hết hạn sử dụng.",
  },
];

const Features = () => {
  return (
    <div
      id="features"
      className="flex py-20 items-center justify-center flex-col border-b"
    >
      <h2 className="text-center font-semibold text-4xl tracking-tight sm:text-5xl">
        Đặc điểm nổi bật
      </h2>
      <p className="text-muted-foreground font-medium text-lg mt-12 text-center max-w-2xl">
        Những tính năng ưu việt được thiết kế riêng cho mô hình kinh doanh thú
        cưng, giúp bạn quản lý dễ dàng hơn bao giờ hết
      </p>
      <div className="mx-auto mt-10 grid max-w-(--breakpoint-lg) gap-6 px-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            className="flex flex-col rounded-xl border px-6 py-6 bg-orange-500/5 shadow-sm transition-colors hover:bg-orange-500/10 hover:shadow-lg"
            key={feature.title}
          >
            <div className="items-center justify-center flex flex-col gap-2 text-center">
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${colorMap[feature.color]?.bg || "bg-gray-500/20"}`}
              >
                <feature.icon
                  className={`size-6 ${colorMap[feature.color]?.text || "text-gray-500"}`}
                />
              </div>
              <span className="font-semibold text-lg">{feature.title}</span>
              <p className="mt-1 text-md text-foreground/80">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
