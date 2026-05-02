import { useNavigate } from "react-router-dom";

import Navbar from "@/features/landing-page/components/navbar";

import { Footer } from "./Footer";
import { Button } from "./ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Trang không tồn tại</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa. Vui
          lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="cursor-pointer"
          >
            Quay lại
          </Button>
          <Button onClick={() => navigate("/")} className="cursor-pointer">
            Về trang chủ
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
