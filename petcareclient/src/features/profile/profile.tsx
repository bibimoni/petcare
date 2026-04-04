import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.success("Đăng xuất thành công");
    navigate("/login");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Trang cá nhân</h2>
      {user ? (
        <div className="space-y-2">
          <div>
            <strong>Họ tên:</strong> {user.full_name || user.fullName || "-"}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Số điện thoại:</strong> {user.phone || "-"}
          </div>
        </div>
      ) : (
        <div>Không có thông tin người dùng.</div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
