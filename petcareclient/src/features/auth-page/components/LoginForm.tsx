import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { login } from "@/lib/auth";

type Errors = { email?: string; password?: string };

export type User = {
  email: string;
  phone: string;
  status: string;
  user_id: number;
  full_name: string;
  role: string | null;
  permissions: string[];
  role_id: number | null;
  store_id: number | null;
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const navigate = useNavigate();

  const validate = (): boolean => {
    const e: Errors = {};
    if (!email) e.email = "Email bắt buộc";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Email không hợp lệ";
    if (!password) e.password = "Mật khẩu bắt buộc";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login({ email, password });
      const token = res?.data?.access_token;
      const user = res?.data?.user || {};

      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        toast.success("Đăng nhập thành công");
        if (user.role == null) {
          navigate("/invitations");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (_err) {
      toast.error(
        "Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 w-full max-w-md"
    >
      {/* Email Field */}
      <div className="flex flex-col gap-2">
        <label className="text-[#1b110d] dark:text-white text-sm font-medium leading-normal">
          Email
        </label>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9a624c]">
            mail
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nhapemail@example.com"
            className="form-input flex w-full rounded-lg text-[#1b110d] dark:text-white dark:bg-[#3a2e2a] focus:outline-0 focus:ring-2 focus:ring-[#ed5012]/20 border border-[#e7d6cf] dark:border-[#5c4a42] focus:border-[#ed5012] h-12 pl-10 pr-4 placeholder:text-[#9a624c] text-base font-normal transition-colors"
          />
        </div>
        {errors.email && (
          <div className="text-sm text-red-600 mt-1">{errors.email}</div>
        )}
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[#1b110d] dark:text-white text-sm font-medium leading-normal">
            Mật khẩu
          </label>
          <a
            href="/forgot-password"
            className="text-[#ed5012] hover:text-orange-700 text-sm font-medium transition-colors"
          >
            Quên mật khẩu?
          </a>
        </div>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9a624c]">
            lock
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-input flex w-full rounded-lg text-[#1b110d] dark:text-white dark:bg-[#3a2e2a] focus:outline-0 focus:ring-2 focus:ring-[#ed5012]/20 border border-[#e7d6cf] dark:border-[#5c4a42] focus:border-[#ed5012] h-12 pl-10 pr-10 placeholder:text-[#9a624c] text-base font-normal transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#9a624c] hover:text-[#ed5012] transition-colors flex items-center"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        {errors.password && (
          <div className="text-sm text-red-600 mt-1">{errors.password}</div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-[#ed5012] hover:bg-orange-600 disabled:opacity-60 transition-colors text-[#fcf9f8] text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-orange-500/30"
      >
        <span className="truncate">
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </span>
      </button>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-[#e7d6cf] dark:border-[#5c4a42]"></div>
        <span className="flex-shrink mx-4 text-[#9a624c] text-xs font-medium uppercase">
          Hoặc
        </span>
        <div className="flex-grow border-t border-[#e7d6cf] dark:border-[#5c4a42]"></div>
      </div>
    </form>
  );
}
