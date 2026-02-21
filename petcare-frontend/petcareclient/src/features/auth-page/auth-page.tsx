import { useLocation } from "react-router";
import { Link } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

export default function AuthPage() {
  const { pathname } = useLocation();

  const isRegister = pathname.includes("register");

  return (
    <div className="bg-[#f8f6f6] dark:bg-[#221510] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] h-full min-h-[600px] flex flex-col md:flex-row bg-white dark:bg-[#2a1d18] rounded-2xl shadow-xl overflow-hidden">
        {/* Left Panel: Login/Register Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 relative">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-12">
            <div className="size-8 text-[#ed5012]">
              <svg
                className="w-full h-full"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6H42L36 24L42 42H6L12 24L6 6Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-[#1b110d] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              PetCare System
            </h2>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-[#1b110d] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-3">
              {isRegister ? "Đăng ký tài khoản" : "Chào mừng trở lại!"}
            </h1>
            <p className="text-[#9a624c] dark:text-[#d4bcae] text-base font-normal">
              {isRegister
                ? "Đăng ký để bắt đầu chăm sóc thú cưng của bạn."
                : "Đăng nhập để tiếp tục chăm sóc thú cưng của bạn."}
            </p>
          </div>

          {/* Form Component */}
          {isRegister ? <RegisterForm /> : <LoginForm />}

          {/* Register/Login Link */}
          <div className="text-center mt-6">
            <p className="text-[#9a624c] dark:text-[#d4bcae] text-sm">
              {isRegister ? (
                <>
                  Đã có tài khoản?{" "}
                  <Link
                    to="/auth/login"
                    className="text-[#ed5012] font-bold hover:underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </>
              ) : (
                <>
                  Chưa có tài khoản?{" "}
                  <Link
                    to="/auth/register"
                    className="text-[#ed5012] font-bold hover:underline"
                  >
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="mt-8 text-xs text-[#9a624c] dark:text-[#887064]">
            © 2024 PetCare System. All rights reserved.
          </div>
        </div>

        {/* Right Panel: Image Illustration */}
        <div className="hidden md:block w-1/2 relative bg-[#fdf2ee] dark:bg-[#1a100c]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBpb4e-FbbNMg6z0CL1sSsnvJopnVrcDpZmq0fH1DkyAscqco5-x-xBAKhfaSn3YMQaa4J2rPYw3cMVtWGuvQZ3l5Tce2mxEZSc03xm7uVKIENp4kIf1XJfCXOIjY5LyCWDkAzXi806lgi6DYd15dEiO3YeoFrm-SxIhDaj64ONslNxB41-sshXJnKXbB4xZG7IpZh3kDZ_fjf_B44i3eXzCUAEEIt8Nf9PaleGH85drqFjK8wox4pbyj0ICH0sls8mEqHqC-A8nExJ')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#ed5012]">
                pets
              </span>
              <p className="font-bold text-lg tracking-wider uppercase">
                Chăm sóc toàn diện
              </p>
            </div>
            <h3 className="text-3xl font-bold leading-snug mb-2">
              Người bạn đồng hành tin cậy cho thú cưng của bạn.
            </h3>
            <p className="text-gray-200 text-sm opacity-90">
              Theo dõi sức khỏe, đặt lịch hẹn và kết nối với bác sĩ thú y hàng
              đầu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
