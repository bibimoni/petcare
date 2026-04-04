import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Phone,
  Image as ImageIcon,
  Loader2,
  Building,
  Map,
} from "lucide-react";

export default function CreateStorePage() {
  const navigate = useNavigate();

  // State quản lý form
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Vietnam",
    postal_code: "",
    logo_url: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên cửa hàng");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Gọi API tạo cửa hàng
      const response = await api.post("/stores", formData);
      const data = response.data || response;

      // 2. Cập nhật localStorage để App (đặc biệt là Sidebar) biết user đã có cửa hàng
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        // Gán store_id và role_id từ BE trả về vào local storage
        currentUser.store_id = data.store.id;
        if (data.admin_role) {
          currentUser.role_id = data.admin_role.id;
        }
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

      toast.success("Khởi tạo cửa hàng thành công!");

      // 3. Chuyển hướng sang trang Dashboard quản lý
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Lỗi tạo cửa hàng:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi tạo cửa hàng";

      if (Array.isArray(errorMessage)) {
        toast.error(errorMessage[0]);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark min-h-screen flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-charcoal dark:text-white mb-2">
            Khởi tạo Cửa hàng của bạn
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Thiết lập thông tin cơ bản để bắt đầu quản lý Pet Shop & Spa.
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            <div className="space-y-8">
              {/* --- Thông tin cơ bản --- */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  Thông tin cơ bản
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                      Tên cửa hàng <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="VD: Petcare Paradise"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-charcoal dark:text-white font-semibold px-11 py-3.5 outline-none transition-all placeholder:font-normal"
                        required
                        maxLength={200}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="0901234567"
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-charcoal dark:text-white px-11 py-3.5 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                        URL Logo (Tùy chọn)
                      </label>
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          name="logo_url"
                          value={formData.logo_url}
                          onChange={handleChange}
                          placeholder="https://example.com/logo.png"
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-charcoal dark:text-white px-11 py-3.5 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Thông tin địa chỉ --- */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  Vị trí & Địa chỉ
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                      Địa chỉ cụ thể
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Số nhà, Tên đường, Phường/Xã..."
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-charcoal dark:text-white px-11 py-3.5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                        Tỉnh / Thành phố
                      </label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="VD: TP. Hồ Chí Minh"
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-charcoal dark:text-white px-11 py-3.5 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                        Quốc gia
                      </label>
                      <div className="relative">
                        <Map className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Vietnam"
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-charcoal dark:text-white px-11 py-3.5 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút Submit */}
            <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang thiết lập...
                  </>
                ) : (
                  "Tạo Cửa Hàng Ngay"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
