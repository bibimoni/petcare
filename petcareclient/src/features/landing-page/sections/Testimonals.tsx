import type { TestimonialItem } from "@/features/landing-page/components/testimonal";

import TestimonialsComponent from "@/features/landing-page/components/testimonal";

const testimonials: TestimonialItem[] = [
  {
    name: "Nguyễn Văn A",
    role: "Chủ cửa hàng",
    company: "Paw & Care Spa",
    avatar:
      "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png?width=40&height=40&format=auto",
    rating: 5,
    content:
      "PetCare đã giúp tôi quản lý cửa hàng spa hiệu quả hơn rất nhiều. Tiết kiệm được 50% thời gian quản lý mỗi ngày và khách hàng rất hài lòng.",
  },
  {
    name: "Trần Thị B",
    role: "Quản lý kho",
    company: "Furry Friends Pet Shop",
    avatar:
      "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png?width=40&height=40&format=auto",
    rating: 5,
    content:
      "Quản lý kho bằng PetCare rất dễ dàng. Tự động cảnh báo khi hàng sắp hết, không bao giờ bị thiếu hàng hay hết hạn nữa.",
  },
  {
    name: "Lê Minh C",
    role: "Nhân viên bán hàng",
    company: "Lovely Pets Store",
    avatar:
      "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png?width=40&height=40&format=auto",
    rating: 5,
    content:
      "Hệ thống POS của PetCare thực sự tuyệt vời. Thanh toán nhanh chóng, tích hợp máy quét mã vạch, khách hàng cảm thấy chuyên nghiệp và hiệu quả.",
  },
  {
    name: "Phạm Đức D",
    role: "Chủ cơ sở grooming",
    company: "Premium Pet Care",
    avatar:
      "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-4.png?width=40&height=40&format=auto",
    rating: 5,
    content:
      "Lưu trữ hồ sơ khách hàng chi tiết rất hữu ích. Tôi có thể theo dõi sở thích của mỗi bé cưng, giúp tôi chăm sóc tốt hơn và khách hàng quay lại nhiều lần.",
  },
];

const TestimonialsPage = () => {
  return <TestimonialsComponent testimonials={testimonials} />;
};

export default TestimonialsPage;
