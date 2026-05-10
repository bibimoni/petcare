import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Navbar from "@/features/landing-page/components/navbar";

const NotAuthenticatedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-9xl font-bold text-destructive mb-4">403</h1>
        <h2 className="text-3xl font-semibold mb-6">
          Bạn không có quyền truy cập
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Xin lỗi, tài khoản của bạn không có đủ quyền để truy cập vào trang
          này. Vui lòng kiểm tra lại quyền hạn của tài khoản hoặc quay về trang
          chủ.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="cursor-pointer"
          >
            Quay lại
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer"
          >
            Về trang chủ
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotAuthenticatedPage;
