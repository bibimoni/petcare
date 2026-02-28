import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { forgotPassword } from "@/lib/auth";

type Errors = { email?: string };

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const currentErrors: Errors = {};

    if (!email) {
      currentErrors.email = "Email bắt buộc";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      currentErrors.email = "Email không hợp lệ";
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
      const res = await forgotPassword({ email });
      if (res?.status === 409) {
        toast.error(
          "Đã có liên kết đặt lại mật khẩu được gửi trước đó, hãy check mail của bạn!",
        );
        return;
      } else if (res?.status === 401) {
        toast.error("Người dùng không tồn tại");
        return;
      } else if (res?.status === 201) {
        toast.success("Liên kết đặt lại mật khẩu đã được gửi.");
        setEmail("");
      }
    } catch (_error) {
      toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 w-full max-w-2xl"
    >
      <div className="rounded-lg border border-[#e7d6cf] dark:border-[#5c4a42] bg-[#fcf9f8] dark:bg-[#3a2e2a] px-4 py-3">
        <p className="text-sm text-[#9a624c] dark:text-[#d4bcae] leading-relaxed">
          Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết để bạn đặt lại mật
          khẩu.
        </p>
      </div>

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
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nhapemail@example.com"
            className="form-input flex w-full rounded-lg text-[#1b110d] dark:text-white dark:bg-[#3a2e2a] focus:outline-0 focus:ring-2 focus:ring-[#ed5012]/20 border border-[#e7d6cf] dark:border-[#5c4a42] focus:border-[#ed5012] h-12 pl-10 pr-4 placeholder:text-[#9a624c] text-base font-normal transition-colors"
          />
        </div>
        {errors.email && (
          <div className="text-sm text-red-600 mt-1">{errors.email}</div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-[#ed5012] hover:bg-orange-600 disabled:opacity-60 transition-colors text-[#fcf9f8] text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-orange-500/30"
      >
        <span className="truncate">
          {loading ? "Đang xử lý..." : "Gửi yêu cầu đặt lại mật khẩu"}
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
        <Link to="/login" className="text-[#ed5012] font-bold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
