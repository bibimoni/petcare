import { Footer } from "@/components/Footer";
import Navbar from "@/features/landing-page/components/navbar";

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Về chúng tôi</h1>
        <div className="prose prose-sm sm:prose-base dark:prose-invert space-y-4">
          <p>
            Chào mừng bạn đến với Petcare, nền tảng số 1 Việt Nam dành riêng cho
            việc quản lý và chăm sóc thú cưng.
          </p>
          <p>
            Được thành lập với sứ mệnh mang đến sự tiện lợi tối đa cho các chủ
            cửa hàng thú cưng và những người yêu động vật, chúng tôi cung cấp
            một giải pháp toàn diện giúp bạn theo dõi sức khỏe, lịch sử khám
            bệnh, cũng như quản lý kho hàng và dịch vụ một cách dễ dàng và hiệu
            quả.
          </p>
          <h2 className="mb-4 mt-8 text-xl font-semibold">Tầm nhìn</h2>
          <p>
            Trở thành hệ sinh thái số hàng đầu giúp kết nối các cửa hàng thú
            cưng, phòng khám thú y và chủ nuôi, tạo ra một cộng đồng yêu thú
            cưng vững mạnh và phát triển.
          </p>
          <h2 className="mb-4 mt-8 text-xl font-semibold">Sứ mệnh</h2>
          <p>
            Cung cấp công cụ công nghệ hiện đại, dễ sử dụng nhằm đơn giản hóa
            việc quản lý và nâng cao chất lượng dịch vụ chăm sóc thú cưng tại
            Việt Nam.
          </p>
          <h2 className="mb-4 mt-8 text-xl font-semibold">Giá trị cốt lõi</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Tận tâm:</strong> Luôn đặt lợi ích của khách hàng và sự an
              toàn của thú cưng lên hàng đầu.
            </li>
            <li>
              <strong>Đổi mới:</strong> Không ngừng nỗ lực nghiên cứu và phát
              triển để cải tiến tính năng sản phẩm.
            </li>
            <li>
              <strong>Đồng hành:</strong> Cùng bạn xây dựng và phát triển sự
              nghiệp chăm sóc thú cưng bền vững.
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUsPage;
