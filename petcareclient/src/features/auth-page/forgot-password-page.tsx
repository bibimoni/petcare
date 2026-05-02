import { Logo } from "@/components/Logo";

import ForgotPasswordForm from "./components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="bg-[#f8f6f6] dark:bg-[#221510] min-h-screen flex flex-col items-center justify-center p-4">
      {/* Centered card */}
      <div className="w-full max-w-[500px] bg-white dark:bg-[#2a1d18] rounded-2xl shadow-xl p-8 md:p-12 mx-auto">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Logo />
        </div>

        {/* Welcome Text */}
        <div className="mb-8 text-center">
          <h1 className="text-[#1b110d] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-3">
            Quên mật khẩu?
          </h1>
          <p className="text-[#9a624c] dark:text-[#d4bcae] text-base font-normal max-w-sm mx-auto">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        <div className="flex justify-center items-center w-full">
          <ForgotPasswordForm />
        </div>

        <div className="mt-8 text-xs text-center text-[#9a624c] dark:text-[#887064]">
          © 2026 PetCare System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
