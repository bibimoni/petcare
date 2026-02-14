import HeroSection from "../components/hero-section";

const menudata = [
  {
    id: 1,
    img: "/src/assets/hero-page/spa-service.jpg",
    imgAlt: "spa-service",
    userComment:
      "Dịch vụ cắt tỉa lông chuyên nghiệp, cún nhà mình trông siêu cute!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-56.png",
  },
  {
    id: 2,
    img: "/src/assets/hero-page/pet-food.jpg",
    imgAlt: "pet-food",
    userComment:
      "Cửa hàng có nhiều loại đồ ăn cho thú cưng chất lượng cao. Nhân viên tư vấn rất nhiệt tình!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-46.png",
  },
  {
    id: 3,
    img: "/src/assets/hero-page/spa-grooming.jpg",
    imgAlt: "grooming-service",
    userComment:
      "Dịch vụ spa cho thú cưng tuyệt vời! Bé cún nhà mình rất thích và trông thật đáng yêu sau khi tắm.",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-57.png",
  },
  {
    id: 4,
    img: "/src/assets/hero-page/pet-accessories.jpg",
    imgAlt: "pet-accessories",
    userComment:
      "Không gian sạch sẽ, thoáng mát. Đồ ăn và phụ kiện cho thú cưng đa dạng, giá cả hợp lý!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-58.png",
  },
  {
    id: 5,
    img: "/src/assets/hero-page/spa-experience.jpg",
    imgAlt: "spa-experience",
    userComment:
      "Trải nghiệm spa thư giãn cho thú cưng, bé cưng về nhà mềm mượt và thơm tho. Rất hài lòng!",
    userAvatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-57.png",
  },
];

const HeroSectionPage = () => {
  return (
    <div>
      {/* Main Content */}
      <main className="flex flex-col pt-17.5">
        <HeroSection menudata={menudata} />
      </main>
    </div>
  );
};

export default HeroSectionPage;
