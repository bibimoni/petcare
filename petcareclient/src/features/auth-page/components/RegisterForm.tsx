import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { register } from "@/lib/auth";

type Errors = {
  email?: string;
  phone?: string;
  terms?: string;
  address?: string;
  fullName?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const navigate = useNavigate();

  const validate = (): boolean => {
    const e: Errors = {};
    if (!formData.fullName) e.fullName = "Họ và tên bắt buộc";
    else if (formData.fullName.length < 2)
      e.fullName = "Họ và tên phải ít nhất 2 ký tự";
    else if (formData.fullName.length > 100)
      e.fullName = "Họ và tên không được vượt quá 100 ký tự";

    if (!formData.address) e.address = "Địa chỉ bắt buộc";
    if (!formData.email) e.email = "Email bắt buộc";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      e.email = "Email không hợp lệ";
    if (!formData.phone) e.phone = "Số điện thoại bắt buộc";
    if (!formData.password) e.password = "Mật khẩu bắt buộc";
    else if (formData.password.length < 8)
      e.password = "Mật khẩu phải ít nhất 8 ký tự";
    else if (formData.password.length > 128)
      e.password = "Mật khẩu không được vượt quá 128 ký tự";
    if (!formData.confirmPassword)
      e.confirmPassword = "Xác nhận mật khẩu bắt buộc";
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Mật khẩu không khớp";
    if (!terms) e.terms = "Bạn phải đồng ý với điều khoản sử dụng";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success("Đăng ký thành công");
      navigate("/login");
    } catch (_error) {
      // API error is handled globally
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/*Full Name &  Address */}
      <div className="flex flex-col sm:flex-row gap-5">
        <label className="flex flex-col flex-1 gap-2">
          <span className="text-sm font-semibold text-[#1c110d] dark:text-gray-200">
            Họ và tên
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              person
            </span>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nhập họ và tên của bạn"
              className="form-input w-full rounded-xl border border-[#e8d6cf] dark:border-gray-700 bg-[#fcf9f8] dark:bg-[#3a2e2a] pl-11 pr-4 py-3.5 text-base focus:ring-2 focus:ring-[#f17341]/20 focus:border-[#f17341] transition-all dark:text-white placeholder:text-gray-400"
            />
          </div>
          {errors.fullName && (
            <span className="text-sm text-red-600">{errors.fullName}</span>
          )}
        </label>
        <label className="flex flex-col flex-1 gap-2">
          <span className="text-sm font-semibold text-[#1c110d] dark:text-gray-200">
            Địa chỉ
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              storefront
            </span>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ"
              className="form-input w-full rounded-xl border border-[#e8d6cf] dark:border-gray-700 bg-[#fcf9f8] dark:bg-[#3a2e2a] pl-11 pr-4 py-3.5 text-base focus:ring-2 focus:ring-[#f17341]/20 focus:border-[#f17341] transition-all dark:text-white placeholder:text-gray-400"
            />
          </div>
          {errors.address && (
            <span className="text-sm text-red-600">{errors.address}</span>
          )}
        </label>
      </div>

      {/* Email & Phone */}
      <div className="flex flex-col sm:flex-row gap-5">
        <label className="flex flex-col flex-1 gap-2">
          <span className="text-sm font-semibold text-[#1c110d] dark:text-gray-200">
            Email
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              mail
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="form-input w-full rounded-xl border border-[#e8d6cf] dark:border-gray-700 bg-[#fcf9f8] dark:bg-[#3a2e2a] pl-11 pr-4 py-3.5 text-base focus:ring-2 focus:ring-[#f17341]/20 focus:border-[#f17341] transition-all dark:text-white placeholder:text-gray-400"
            />
          </div>
          {errors.email && (
            <span className="text-sm text-red-600">{errors.email}</span>
          )}
        </label>
        <label className="flex flex-col flex-1 gap-2">
          <span className="text-sm font-semibold text-[#1c110d] dark:text-gray-200">
            Số điện thoại
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              call
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
              className="form-input w-full rounded-xl border border-[#e8d6cf] dark:border-gray-700 bg-[#fcf9f8] dark:bg-[#3a2e2a] pl-11 pr-4 py-3.5 text-base focus:ring-2 focus:ring-[#f17341]/20 focus:border-[#f17341] transition-all dark:text-white placeholder:text-gray-400"
            />
          </div>
          {errors.phone && (
            <span className="text-sm text-red-600">{errors.phone}</span>
          )}
        </label>
      </div>

      {/* Password & Confirm Password */}
      <div className="flex flex-col sm:flex-row gap-5">
        <label className="flex flex-col flex-1 gap-2">
          <span className="text-sm font-semibold text-[#1c110d] dark:text-gray-200">
            Mật khẩu
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              lock
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="form-input w-full rounded-xl border border-[#e8d6cf] dark:border-gray-700 bg-[#fcf9f8] dark:bg-[#3a2e2a] pl-11 pr-10 py-3.5 text-base focus:ring-2 focus:ring-[#f17341]/20 focus:border-[#f17341] transition-all dark:text-white placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.password && (
            <span className="text-sm text-red-600">{errors.password}</span>
          )}
        </label>
        <label className="flex flex-col flex-1 gap-2">
          <span className="text-sm font-semibold text-[#1c110d] dark:text-gray-200">
            Xác nhận mật khẩu
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              lock_reset
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="form-input w-full rounded-xl border border-[#e8d6cf] dark:border-gray-700 bg-[#fcf9f8] dark:bg-[#3a2e2a] pl-11 pr-10 py-3.5 text-base focus:ring-2 focus:ring-[#f17341]/20 focus:border-[#f17341] transition-all dark:text-white placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {showConfirmPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-sm text-red-600">
              {errors.confirmPassword}
            </span>
          )}
        </label>
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3 mt-2">
        <div className="flex h-6 items-center">
          <input
            type="checkbox"
            id="terms"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-[#f17341] focus:ring-[#f17341] dark:border-gray-600 dark:bg-[#3a2e2a]"
          />
        </div>
        <div className="text-sm leading-6">
          <label
            htmlFor="terms"
            className="font-medium text-gray-900 dark:text-gray-300"
          >
            Tôi đồng ý với{" "}
            <a
              href="/term-and-service"
              target="_blank"
              className="font-semibold text-[#f17341] hover:text-[#d95d2e] hover:underline"
            >
              Điều khoản sử dụng
            </a>{" "}
            và{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              className="font-semibold text-[#f17341] hover:text-[#d95d2e] hover:underline"
            >
              Chính sách bảo mật
            </a>{" "}
            của PetCare.
          </label>
        </div>
      </div>
      {errors.terms && (
        <span className="text-sm text-red-600">{errors.terms}</span>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full justify-center rounded-xl bg-[#f17341] px-3 py-4 text-base font-bold leading-6 text-white shadow-sm hover:bg-[#d95d2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f17341] transition-colors duration-200 gap-2 items-center group disabled:opacity-60"
      >
        <span className="truncate">
          {loading ? "Đang xử lý..." : "Tạo tài khoản"}
        </span>
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">
          arrow_forward
        </span>
      </button>
    </form>
  );
}
