import HeroSection from "../components/hero-section";

const menudata = [
  {
    id: 1,
    img: "/images/hero-page/spa-service.jpg",
    imgAlt: "spa-service",
    userComment:
      "Hệ thống PetCare giúp tôi quản lý lịch hẹn spa rất dễ dàng. Khách hàng cũng nhận được thông báo tự động qua SMS/Zalo, hài lòng lắm!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-56.png",
  },
  {
    id: 2,
    img: "/images/hero-page/pet-food.jpg",
    imgAlt: "pet-food",
    userComment:
      "Tính năng POS bán hàng thực sự tuyệt vời! Thanh toán nhanh, tích hợp máy quét mã vạch, doanh thu tăng 30% chỉ sau 2 tháng.",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-46.png",
  },
  {
    id: 3,
    img: "/images/hero-page/spa-grooming.jpg",
    imgAlt: "grooming-service",
    userComment:
      "Quản lý hồ sơ thú cưng rất chi tiết - theo dõi được loại spa, sở thích, lịch sử. Khách hàng cảm thấy được quan tâm chuyên biệt!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-57.png",
  },
  {
    id: 4,
    img: "/images/hero-page/pet-accessories.jpg",
    imgAlt: "pet-accessories",
    userComment:
      "Quản lý kho thông minh - tự động cảnh báo khi hàng sắp hết, không bao giờ bị hết hàng hay tồn kho lâu. Tuyệt vời!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-58.png",
  },
  {
    id: 5,
    img: "/images/hero-page/spa-experience.jpg",
    imgAlt: "spa-experience",
    userComment:
      "Giao diện dễ sử dụng, nhân viên không cần đào tạo lâu. Chi phí quản lý giảm 50%, lợi nhuận tăng lên đáng kể!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-57.png",
  },
];

const HeroSectionPage = () => {
  return (
    <div>
      {/* Main Content */}
      <main id="introduction" className="flex flex-col pt-17.5">
        <HeroSection menudata={menudata} />
      </main>
    </div>
  );
};

export default HeroSectionPage;
