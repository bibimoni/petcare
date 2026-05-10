import { Footer } from "@/components/Footer";
import Navbar from "@/features/landing-page/components/navbar";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Chính sách bảo mật</h1>
        <div className="prose prose-sm sm:prose-base dark:prose-invert space-y-4">
          <p>
            Tại Petcare, chúng tôi coi trọng quyền riêng tư của bạn. Chính sách
            này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin
            cá nhân của bạn khi bạn sử dụng dịch vụ của chúng tôi.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            1. Thu thập thông tin
          </h2>
          <p>
            Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, sử dụng dịch
            vụ, hoặc liên hệ với chúng tôi. Thông tin này có thể bao gồm tên,
            địa chỉ email, số điện thoại, và thông tin về thú cưng của bạn.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            2. Sử dụng thông tin
          </h2>
          <p>
            Thông tin thu thập được sử dụng để cung cấp, duy trì và cải thiện
            dịch vụ; để xử lý các giao dịch; và để liên lạc với bạn về các bản
            cập nhật, ưu đãi hoặc các vấn đề liên quan đến tài khoản.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            3. Chia sẻ thông tin
          </h2>
          <p>
            Chúng tôi cam kết không bán, trao đổi hoặc chuyển giao thông tin cá
            nhân của bạn cho bên thứ ba ngoại trừ các trường hợp được pháp luật
            yêu cầu hoặc với các đối tác đáng tin cậy hỗ trợ chúng tôi vận hành
            trang web và cung cấp dịch vụ cho bạn.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            4. Bảo mật dữ liệu
          </h2>
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật hiện đại nhằm bảo vệ thông
            tin cá nhân của bạn khỏi việc truy cập, thay đổi, tiết lộ hoặc phá
            hủy trái phép. Tuy nhiên, không có phương thức truyền tải nào qua
            Internet hoặc phương thức lưu trữ điện tử nào an toàn 100%.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            5. Quyền lợi của bạn
          </h2>
          <p>
            Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân
            của mình bất kỳ lúc nào bằng cách đăng nhập vào tài khoản hoặc liên
            hệ với bộ phận hỗ trợ khách hàng.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            6. Thay đổi chính sách
          </h2>
          <p>
            Chính sách bảo mật này có thể được cập nhật theo thời gian. Chúng
            tôi sẽ thông báo cho bạn về bất kỳ thay đổi quan trọng nào bằng cách
            đăng tải chính sách mới trên trang web.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
