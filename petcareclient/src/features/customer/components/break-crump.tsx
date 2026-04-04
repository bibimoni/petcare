import { Link, useLocation } from "react-router-dom";

export default function Breadcrumb() {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    customers: "Quản lí Khách hàng",
    dashboard: "Trang chủ",
  };

  return (
    <div className="text-sm text-gray-500 mb-2">
      <Link to="/" className="hover:underline">
        Trang chủ
      </Link>

      {pathnames.map((value, index) => {
        const to = "/" + pathnames.slice(0, index + 1).join("/");

        return (
          <span key={to}>
            {" "}
            ›{" "}
            <Link to={to} className="hover:underline">
              {labels[value] || value}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
