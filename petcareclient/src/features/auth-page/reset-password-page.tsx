import { Logo } from "@/components/Logo";

import ResetPasswordForm from "./components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="bg-[#f8f6f6] dark:bg-[#221510] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] flex flex-col bg-white dark:bg-[#2a1d18] rounded-2xl shadow-xl p-8 md:p-12 mx-auto">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Logo />
        </div>

        {/* Welcome Text */}
        <div className="mb-8 text-center">
          <h1 className="text-[#1b110d] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-3">
            Đặt lại mật khẩu
          </h1>
          <p className="text-[#9a624c] dark:text-[#d4bcae] text-base font-normal max-w-sm mx-auto">
            Tạo mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        {/* Form Component */}
        <div className="flex justify-center items-center w-full">
          <ResetPasswordForm />
        </div>

        <div className="mt-8 text-xs text-center text-[#9a624c] dark:text-[#887064]">
          © 2026 PetCare System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
