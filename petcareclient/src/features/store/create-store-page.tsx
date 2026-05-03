import { countries } from "country-data-list";
import {
  Phone,
  Store,
  MapPin,
  Trash2,
  Upload,
  Loader2,
  Building,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Sidebar } from "@/components/Sidebar";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import api from "@/lib/api";
import { queryClient } from "@/lib/query-client";

export default function CreateStorePage() {
  const navigate = useNavigate();
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
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);

  const selectedCountryAlpha3 =
    countries.all.find((country) => country.name === formData.country)
      ?.alpha3 ?? "VNM";

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return previewUrl;
    });
    setSelectedLogoFile(file);
  };

  const clearLogoImage = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoPreviewUrl("");
    setSelectedLogoFile(null);
    setFormData((prev) => ({ ...prev, logo_url: "" }));
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên cửa hàng");
      return;
    }

    setIsLoading(true);

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "logo_url") {
          payload.append(key, value);
        }
      });

      if (selectedLogoFile) {
        payload.append("file", selectedLogoFile);
      }

      // 1. Gọi API tạo cửa hàng
      const response = await api.post("/stores", payload);
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

      queryClient.invalidateQueries({ queryKey: ["sidebar-user"] });

      toast.success("Khởi tạo cửa hàng thành công!");
      clearLogoImage();

      // 3. Chuyển hướng sang trang Dashboard quản lý
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: unknown) {
      console.error("Lỗi tạo cửa hàng:", error);

      const responseError =
        typeof error === "object" && error !== null && "response" in error
          ? (error as {
              response?: {
                data?: { message?: string | string[] };
              };
            })
          : undefined;

      const errorMessage =
        responseError?.response?.data?.message ||
        "Có lỗi xảy ra khi tạo cửa hàng";

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
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 bg-surface-light dark:bg-surface-dark px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            {/* Header Section */}
            <div className="mb-6 shrink-0 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Store className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-charcoal dark:text-white mb-2">
                Khởi tạo Cửa hàng của bạn
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Thiết lập thông tin cơ bản để bắt đầu quản lý Pet Shop & Spa.
              </p>
            </div>

            {/* Form Section */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8"
              >
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
                            Logo Cửa hàng
                          </label>

                          <label
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleLogoDrop}
                            className="relative h-[180px] md:h-[220px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700/40 transition overflow-hidden"
                          >
                            {logoPreviewUrl ? (
                              <>
                                <img
                                  src={logoPreviewUrl}
                                  alt="Store logo preview"
                                  className="absolute inset-0 w-full h-full object-contain bg-white dark:bg-gray-900"
                                />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    clearLogoImage();
                                  }}
                                  className="absolute top-2 right-2 bg-white/95 p-1 rounded-lg shadow hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-orange-400 mb-1" />
                                <p className="text-sm font-semibold text-charcoal dark:text-white">
                                  Chọn logo cửa hàng
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Kéo thả hoặc click để tải ảnh
                                </p>
                              </>
                            )}

                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImage(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* --- Thông tin địa chỉ --- */}
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
                            Tỉnh/ Thành phố
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
                          <div className="relative flex items-center">
                            <CountryDropdown
                              placeholder="Chọn quốc gia"
                              defaultValue={selectedCountryAlpha3}
                              onChange={(country) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  country: country.name,
                                }));
                              }}
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
                    className="w-full cursor-pointer md:w-auto bg-orange-600/80 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Đang thiết lập...
                      </>
                    ) : (
                      "Tạo Cửa Hàng"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
