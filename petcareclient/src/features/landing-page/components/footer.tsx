import { cn } from "@/lib/utils";

import { Logo } from "./logo";

interface MenuItem {
  title: string;
  links: {
    url: string;
    text: string;
  }[];
}

interface FooterProps {
  tagline?: string;
  className?: string;
  copyright?: string;
  menuItems?: MenuItem[];
  bottomLinks?: {
    url: string;
    text: string;
  }[];
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
}

const Footer = ({
  className,
  tagline = "Nền tảng quản lý cửa hàng thú cưng số 1 Việt Nam. Giúp bạn tập trung vào việc chăm sóc, để việc quản lý cho chúng tôi",
  menuItems = [
    {
      title: "Sản phẩm",
      links: [
        { text: "Tính năng", url: "#" },
        { text: "Dùng thử", url: "#" },
        { text: "Tải ứng dụng", url: "#" },
      ],
    },
    {
      title: "Công ty",
      links: [
        { text: "Về chúng tôi", url: "#" },
        { text: "Blog", url: "#" },
        { text: "Liên hệ", url: "#" },
      ],
    },
    {
      title: "Hỗ trợ",
      links: [
        { text: "Trung tâm trợ giúp", url: "#" },
        { text: "Câu hỏi thường gặp", url: "#" },
        { text: "Điều khoản", url: "#" },
      ],
    },
  ],
  copyright = "© 2026 PetCare. All rights reserved.",
  bottomLinks = [
    { text: "Chính sách bảo mật", url: "#" },
    { text: "Điều khoản sử dụng", url: "#" },
  ],
}: FooterProps) => {
  return (
    <section className={cn("py-32 px-32", className)}>
      <div className="container">
        <footer>
          <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-16">
            <div className="mb-8 lg:mb-0 max-w-sm">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p className="mt-4 font-sm text-muted-foreground">{tagline}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
              {menuItems.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  <h3 className="mb-4 font-bold">{section.title}</h3>
                  <ul className="space-y-4 text-muted-foreground">
                    {section.links.map((link, linkIdx) => (
                      <li
                        key={linkIdx}
                        className="font-medium hover:text-primary"
                      >
                        <a href={link.url}>{link.text}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-24 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
            <p>{copyright}</p>
            <ul className="flex gap-4">
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="underline hover:text-primary">
                  <a href={link.url}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
