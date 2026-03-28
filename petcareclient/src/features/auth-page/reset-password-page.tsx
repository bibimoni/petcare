import { Logo } from "@/components/Logo";

import ResetPasswordForm from "./components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="bg-[#f8f6f6] dark:bg-[#221510] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col bg-white dark:bg-[#2a1d18] rounded-2xl shadow-xl p-8 md:p-16">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-12">
          <Logo />
        </div>

        {/* Welcome Text */}
        <div className="mb-8">
          <h1 className="text-[#1b110d] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-3">
            Đặt lại mật khẩu
          </h1>
          <p className="text-[#9a624c] dark:text-[#d4bcae] text-base font-normal">
            Tạo mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        {/* Form Component */}
        <ResetPasswordForm />

        <div className="mt-8 text-xs text-[#9a624c] dark:text-[#887064]">
          © 2026 PetCare System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
