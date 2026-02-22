import { Link } from "react-router-dom";

export default function App() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">PetCare Frontend</h2>
      <div className="space-x-2">
        <Link to="/auth/login" className="text-blue-600 underline">
          Đăng nhập
        </Link>
        <Link to="/auth/register" className="text-blue-600 underline">
          Đăng ký
        </Link>
      </div>
    </div>
  );
}
