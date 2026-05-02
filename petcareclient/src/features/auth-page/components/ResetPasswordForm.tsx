import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { resetPassword } from "@/lib/auth";

type Errors = {
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const currentErrors: Errors = {};

    if (!token) {
      currentErrors.token = "Token không hợp lệ hoặc bị thiếu";
    }

    if (!newPassword) {
      currentErrors.newPassword = "Mật khẩu mới bắt buộc";
    } else if (newPassword.length < 8) {
      currentErrors.newPassword = "Mật khẩu phải ít nhất 8 ký tự";
    } else if (newPassword.length > 128) {
      currentErrors.newPassword = "Mật khẩu không được vượt quá 128 ký tự";
    }

    if (!confirmPassword) {
      currentErrors.confirmPassword = "Xác nhận mật khẩu bắt buộc";
    } else if (newPassword !== confirmPassword) {
      currentErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: token!, newPassword });
      toast.success("Mật khẩu đã được đặt lại thành công!");
      navigate("/login");
    } catch (_error) {
      navigate("/forgot-password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/30 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-200">
            Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật
            khẩu mới.
          </p>
        </div>
        <a
          href="/forgot-password"
          className="text-center text-[#ed5012] font-bold hover:underline text-sm"
        >
          Quay lại yêu cầu đặt lại mật khẩu
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div className="rounded-lg border border-[#e7d6cf] dark:border-[#5c4a42] bg-[#fcf9f8] dark:bg-[#3a2e2a] px-4 py-3">
        <p className="text-sm text-[#9a624c] dark:text-[#d4bcae] leading-relaxed">
          Vui lòng nhập mật khẩu mới của bạn. Mật khẩu phải có ít nhất 8 ký tự.
        </p>
      </div>

      {/* New Password Field */}
      <div className="flex flex-col gap-2">
        <label className="text-[#1b110d] dark:text-white text-sm font-medium leading-normal">
          Mật khẩu mới
        </label>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9a624c]">
            lock
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
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
        {errors.newPassword && (
          <div className="text-sm text-red-600 mt-1">{errors.newPassword}</div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="flex flex-col gap-2">
        <label className="text-[#1b110d] dark:text-white text-sm font-medium leading-normal">
          Xác nhận mật khẩu
        </label>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9a624c]">
            lock_reset
          </span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            className="form-input flex w-full rounded-lg text-[#1b110d] dark:text-white dark:bg-[#3a2e2a] focus:outline-0 focus:ring-2 focus:ring-[#ed5012]/20 border border-[#e7d6cf] dark:border-[#5c4a42] focus:border-[#ed5012] h-12 pl-10 pr-10 placeholder:text-[#9a624c] text-base font-normal transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 text-[#9a624c] hover:text-[#ed5012] transition-colors flex items-center"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="text-sm text-red-600 mt-1">
            {errors.confirmPassword}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-[#ed5012] hover:bg-orange-600 disabled:opacity-60 transition-colors text-[#fcf9f8] text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-orange-500/30"
      >
        <span className="truncate">
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </span>
      </button>

      <div className="relative flex py-2 items-center">
        <div className="grow border-t border-[#e7d6cf] dark:border-[#5c4a42]"></div>
        <span className="shrink mx-4 text-[#9a624c] text-xs font-medium uppercase">
          Hoặc
        </span>
        <div className="grow border-t border-[#e7d6cf] dark:border-[#5c4a42]"></div>
      </div>

      <p className="text-center text-sm text-[#9a624c] dark:text-[#d4bcae]">
        Quay lại{" "}
        <a href="/login" className="text-[#ed5012] font-bold hover:underline">
          Đăng nhập
        </a>
      </p>
    </form>
  );
}
