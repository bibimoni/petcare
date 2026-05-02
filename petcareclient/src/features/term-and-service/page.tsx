import { Footer } from "@/components/footer";
import Navbar from "@/features/landing-page/components/navbar";

const TermAndServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Điều khoản và Dịch vụ</h1>
        <div className="prose prose-sm sm:prose-base dark:prose-invert space-y-4">
          <p>
            Chào mừng bạn đến với Petcare. Bằng việc sử dụng trang web và dịch
            vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện
            dưới đây. Vui lòng đọc kỹ trước khi sử dụng.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            1. Chấp nhận điều khoản
          </h2>
          <p>
            Khi truy cập và sử dụng các dịch vụ của Petcare, bạn đồng ý bị ràng
            buộc bởi các Điều khoản và Dịch vụ này. Nếu bạn không đồng ý với bất
            kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ của
            chúng tôi.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            2. Dịch vụ của chúng tôi
          </h2>
          <p>
            Petcare cung cấp nền tảng để quản lý, chăm sóc thú cưng, đặt lịch
            dịch vụ và mua sắm các sản phẩm liên quan. Chúng tôi có quyền thay
            đổi, tạm ngừng hoặc chấm dứt bất kỳ phần nào của dịch vụ vào bất kỳ
            lúc nào mà không cần thông báo trước.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            3. Tài khoản người dùng
          </h2>
          <p>
            Bạn có thể cần tạo tài khoản để sử dụng một số tính năng. Bạn chịu
            trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Bạn
            đồng ý thông báo ngay cho chúng tôi về bất kỳ việc sử dụng trái phép
            nào đối với tài khoản của bạn.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">4. Quyền riêng tư</h2>
          <p>
            Việc thu thập và sử dụng thông tin cá nhân của bạn được quy định
            trong Chính sách bảo mật của chúng tôi. Bằng cách sử dụng dịch vụ,
            bạn đồng ý với việc chúng tôi thu thập và sử dụng thông tin theo
            chính sách đó.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            5. Trách nhiệm của người dùng
          </h2>
          <p>
            Bạn đồng ý không sử dụng dịch vụ của chúng tôi cho bất kỳ mục đích
            bất hợp pháp nào hoặc vi phạm bất kỳ luật pháp nào ở khu vực của
            bạn. Bạn không được truyền tải bất kỳ worm, virus hay bất kỳ mã độc
            nào.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">
            6. Sửa đổi điều khoản
          </h2>
          <p>
            Chúng tôi có quyền cập nhật, thay đổi hoặc thay thế bất kỳ phần nào
            của các Điều khoản và Dịch vụ này bằng cách đăng tải các bản cập
            nhật và/hoặc thay đổi lên trang web. Bạn có trách nhiệm kiểm tra
            trang web này định kỳ để cập nhật thay đổi.
          </p>

          <h2 className="mb-4 mt-8 text-xl font-semibold">7. Liên hệ</h2>
          <p>
            Nếu bạn có bất kỳ câu hỏi nào về Điều khoản và Dịch vụ, vui lòng
            liên hệ với chúng tôi qua email hỗ trợ của Petcare.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermAndServicePage;
