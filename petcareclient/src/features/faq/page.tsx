import { ChevronDown } from "lucide-react";

import { Footer } from "@/components/Footer";
import Navbar from "@/features/landing-page/components/navbar";

const FaqPage = () => {
  const faqs = [
    {
      question:
        "Khi lựa chọn đăng ký sử dụng Petcare, tôi sẽ nhận được những gì?",
      answer:
        "Khi đăng ký sử dụng hệ thống Petcare, bạn sẽ được cung cấp một nền tảng quản lý toàn diện dành riêng cho cửa hàng thú cưng. Nền tảng bao gồm các tính năng như quản lý lịch hẹn dịch vụ, lưu trữ hồ sơ y tế thú cưng, quản lý khách hàng, quản lý kho hàng và hệ thống điểm bán hàng (POS) tích hợp. Tất cả những công cụ này giúp bạn tối ưu hóa hoạt động kinh doanh và tiết kiệm thời gian đáng kể.",
    },
    {
      question:
        "Sau khi đăng ký tài khoản cho cửa hàng, tôi có thể thêm bao nhiêu nhân viên?",
      answer:
        "Với Petcare, bạn có thể thêm số lượng nhân viên hoàn toàn KHÔNG GIỚI HẠN. Chúng tôi hiểu rằng các cửa hàng thú cưng có thể có nhiều bộ phận khác nhau (bác sĩ thú y, nhân viên grooming, thu ngân), vì vậy hệ thống cho phép bạn tạo nhiều tài khoản nhân viên để mọi người cùng phối hợp làm việc trên một hệ thống.",
    },
    {
      question:
        "Petcare có hỗ trợ quản lý lịch hẹn (booking) cho spa/grooming không?",
      answer:
        "Có, Petcare được thiết kế với một hệ thống quản lý lịch hẹn chuyên nghiệp. Bạn có thể dễ dàng tạo, sửa đổi và theo dõi các lịch hẹn grooming, khám chữa bệnh cho thú cưng, giúp tránh tình trạng trùng lịch và nâng cao trải nghiệm của khách hàng.",
    },
    {
      question:
        "Thông tin dữ liệu của cửa hàng và khách hàng có được bảo mật không?",
      answer:
        "Chúng tôi áp dụng các tiêu chuẩn bảo mật nghiêm ngặt và mã hóa dữ liệu cao cấp để đảm bảo mọi thông tin cá nhân của khách hàng, hồ sơ thú cưng, cũng như các dữ liệu kinh doanh của cửa hàng bạn luôn được an toàn tuyệt đối.",
    },
    {
      question:
        "Nếu gặp sự cố trong quá trình sử dụng, tôi có thể liên hệ hỗ trợ như thế nào?",
      answer:
        "Đội ngũ chăm sóc khách hàng của Petcare luôn sẵn sàng hỗ trợ bạn. Bạn có thể gửi email qua petcarevn@gmail.com hoặc liên hệ trực tiếp thông qua mục 'Liên hệ' trên website. Chúng tôi sẽ cố gắng phản hồi và giải quyết vấn đề của bạn trong thời gian sớm nhất.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Câu hỏi thường gặp (FAQ)
          </h1>
          <p className="text-lg text-muted-foreground">
            Giải đáp các thắc mắc phổ biến về dịch vụ và nền tảng của Petcare
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group border rounded-lg [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-lg">
                <span className="pr-4">{faq.question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" />
              </summary>
              <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FaqPage;
