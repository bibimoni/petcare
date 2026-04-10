import { toNumber } from "lodash";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { ProductDto } from "@/features/inventory/api/products.api";
import type { ServiceDto } from "@/features/service/api/service.api";

import { Sidebar } from "@/components/Sidebar";
import { getProductsForTable } from "@/features/inventory/api/products.api";
import { getServicesForTable } from "@/features/service/api/service.api";
import { sidebarUser, getSidebarUser, type SidebarUser } from "@/lib/user";

import { ServiceDetailModal } from "./components/service-detail-modal";
import { formatPrice } from "./utils";

const fallbackPosImages = [
  "/images/hero-page/pet-food.jpg",
  "/images/hero-page/pet-accessories.jpg",
  "/images/hero-page/spa-grooming.jpg",
  "/images/hero-page/spa-service.jpg",
  "/images/hero-page/spa-experience.jpg",
];

type PosProduct = {
  id: number;
  name: string;
  price: string;
  stock: number;
  image: string;
  description: string;
};

type PosService = {
  id: number;
  name: string;
  icon: string;
  price: string;
  rawPrice: number;
  iconTone: string;
  minWeight: number;
  maxWeight: number;
  description: string;
  categoryName: string;
};

type PosTransaction = {
  id: string;
  time: string;
  total: string;
  service: string;
  customer: string;
  status: "Hoàn thành" | "Chờ thanh toán" | "Đã huỷ";
};

const recentTransactions: PosTransaction[] = [
  {
    id: "#POS-0922",
    time: "10:45",
    total: "637.200d",
    service: "Goi Spa Cat Tia (Full), Pate Whiskas",
    status: "Hoàn thành",
    customer: "Nguyen Van A",
  },
  {
    id: "#POS-0921",
    time: "09:30",
    total: "120.000d",
    service: "Sua tam SOS Trang",
    status: "Hoàn thành",
    customer: "Tran Thi Hoa",
  },
  {
    id: "#POS-0920",
    time: "09:15",
    total: "350.000d",
    service: "Thuc an hat Royal Canin",
    status: "Chờ thanh toán",
    customer: "Khach le",
  },
  {
    id: "#POS-0919",
    time: "08:45",
    total: "110.000d",
    service: "Do choi Xuong Gai, Cat ve sinh",
    status: "Đã huỷ",
    customer: "Le Van Tung",
  },
];

const statusClassMap: Record<PosTransaction["status"], string> = {
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Chờ thanh toán": "bg-amber-100 text-amber-700",
  "Đã huỷ": "bg-gray-200 text-gray-600",
};

const getServiceIconMeta = (serviceName: string) => {
  const name = serviceName.toLowerCase();

  if (name.includes("tắm") || name.includes("sấy")) {
    return {
      icon: "shower",
      iconTone: "bg-[#e0f2f1] text-[#1b7b79]",
    };
  }

  if (name.includes("cắt") || name.includes("tỉa")) {
    return {
      icon: "content_cut",
      iconTone: "bg-[#fde8de] text-[#c36d47]",
    };
  }

  if (name.includes("tiêm") || name.includes("khám") || name.includes("y tế")) {
    return {
      icon: "medical_services",
      iconTone: "bg-[#e9f3eb] text-[#2f8a55]",
    };
  }

  if (
    name.includes("trông") ||
    name.includes("lưu trú") ||
    name.includes("khách sạn") ||
    name.includes("ngày")
  ) {
    return {
      icon: "home",
      iconTone: "bg-[#e9f3eb] text-[#5e8f68]",
    };
  }

  return {
    icon: "pets",
    iconTone: "bg-[#f3ebe7] text-[#8b6955]",
  };
};

const mapServiceToPosService = (
  service: ServiceDto,
  index: number,
): PosService => {
  const serviceName = String(service.combo_name ?? "Dịch vụ");
  const iconMeta = getServiceIconMeta(serviceName);
  const rawPrice = toNumber(service.price);

  return {
    id: Number(service.id) || index + 1,
    name: serviceName,
    icon: iconMeta.icon,
    price: formatPrice(service.price),
    rawPrice: Number.isFinite(rawPrice) ? rawPrice : 0,
    categoryName:
      typeof service.category_name === "string" && service.category_name.trim()
        ? service.category_name
        : "Khác",
    minWeight: Number.isFinite(toNumber(service.min_weight))
      ? toNumber(service.min_weight)
      : 0,
    maxWeight: Number.isFinite(toNumber(service.max_weight))
      ? toNumber(service.max_weight)
      : 0,
    iconTone: iconMeta.iconTone,
    description:
      typeof service.description === "string" && service.description.trim()
        ? service.description
        : "Tắm, sấy, cắt tỉa, mài móng",
  };
};

const mapInventoryProductToPosProduct = (
  product: ProductDto,
  index: number,
): PosProduct => {
  const parsedId = toNumber(product.product_id);

  return {
    id: parsedId ?? index + 1,
    name: String(product.name ?? "Sản phẩm"),
    price: formatPrice(product.sell_price),
    stock: toNumber(product.stock_quantity) ?? 0,
    image:
      typeof product.image_url === "string" && product.image_url.trim()
        ? product.image_url
        : fallbackPosImages[index % fallbackPosImages.length],
    description:
      typeof product.description === "string" && product.description.trim()
        ? product.description
        : "Sản phẩm cho thú cưng",
  };
};

const PosPage = () => {
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 5;
  const [profile, setProfile] = useState<SidebarUser | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedCatalogTab, setSelectedCatalogTab] = useState<
    "service" | "product"
  >("service");
  const [services, setServices] = useState<PosService[]>([]);
  const [hotProducts, setHotProducts] = useState<PosProduct[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [servicePage, setServicePage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [isServiceDetailOpen, setIsServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PosService | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const user = await getSidebarUser();

      if (isMounted) {
        setProfile(user);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      if (isMounted) {
        setIsServicesLoading(true);
      }

      try {
        const serviceItems = await getServicesForTable("all");
        const mappedServices = serviceItems.map(mapServiceToPosService);

        if (isMounted) {
          setServices(mappedServices);
        }
      } catch (error) {
        console.error("Lỗi tải dịch vụ POS:", error);
      } finally {
        if (isMounted) {
          setIsServicesLoading(false);
        }
      }
    };

    const loadHotProducts = async () => {
      if (isMounted) {
        setIsProductsLoading(true);
      }

      try {
        const inventoryProducts = await getProductsForTable("all");
        const mappedProducts = inventoryProducts.map(
          mapInventoryProductToPosProduct,
        );

        if (isMounted) {
          setHotProducts(mappedProducts);
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm POS:", error);
      } finally {
        if (isMounted) {
          setIsProductsLoading(false);
        }
      }
    };

    void loadServices();
    void loadHotProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const greetingName = useMemo(() => {
    const fullName = profile?.full_name?.trim();
    if (fullName) {
      return fullName;
    }

    return "Bạn";
  }, [profile?.full_name]);

  const currentShift = useMemo(() => {
    const hour = currentTime.getHours();

    if (hour >= 8 && hour < 12) {
      return {
        label: "Ca sáng",
        timeRange: "08:00 - 12:00",
      };
    }

    if (hour >= 13 && hour < 17) {
      return {
        label: "Ca chiều",
        timeRange: "13:00 - 17:00",
      };
    }

    return {
      label: "Ngoài ca",
      timeRange: "08:00 - 12:00 | 13:00 - 17:00",
    };
  }, [currentTime]);

  const servicePages = useMemo(() => {
    if (services.length === 0) {
      return [];
    }

    const pages: PosService[][] = [];

    for (let index = 0; index < services.length; index += ITEMS_PER_PAGE) {
      pages.push(services.slice(index, index + ITEMS_PER_PAGE));
    }

    return pages;
  }, [services]);

  const productPages = useMemo(() => {
    if (hotProducts.length === 0) {
      return [];
    }

    const pages: PosProduct[][] = [];

    for (let index = 0; index < hotProducts.length; index += ITEMS_PER_PAGE) {
      pages.push(hotProducts.slice(index, index + ITEMS_PER_PAGE));
    }

    return pages;
  }, [hotProducts]);

  const activePage =
    selectedCatalogTab === "service" ? servicePage : productPage;
  const activePages =
    selectedCatalogTab === "service" ? servicePages : productPages;
  const activeLength =
    selectedCatalogTab === "service" ? services.length : hotProducts.length;

  useEffect(() => {
    if (servicePage > Math.max(servicePages.length, 1)) {
      setServicePage(Math.max(servicePages.length, 1));
    }
  }, [servicePage, servicePages.length]);

  useEffect(() => {
    if (productPage > Math.max(productPages.length, 1)) {
      setProductPage(Math.max(productPages.length, 1));
    }
  }, [productPage, productPages.length]);

  useEffect(() => {
    if (selectedCatalogTab === "service") {
      setServicePage(1);
      return;
    }

    setProductPage(1);
  }, [selectedCatalogTab]);

  const handleOpenServiceDetail = (service: PosService) => {
    setSelectedService(service);
    setIsServiceDetailOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-[#f0e6df] bg-[#faf7f5]/90 px-6 backdrop-blur-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cb8f6a]">
              POS
            </p>
            <h1 className="text-base font-bold text-[#2f231d]">
              Điểm bán hàng
            </h1>
          </div>

          <div className="relative w-full max-w-xl">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#be9477]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm sản phẩm, dịch vụ hoặc khách hàng"
              className="h-10 w-full rounded-full border border-[#ecdcd1] bg-[#fdfaf8] pl-12 pr-4 text-sm text-[#523c30] outline-none transition focus:border-[#dcae8c] focus:ring-2 focus:ring-[#f3d8c4]"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#ecdcd1] bg-white text-[#7a5f50] transition hover:bg-[#f9f0ea]"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="text-right">
              <p className="text-xs text-[#9a7a67]">{currentShift.label}</p>
              <p className="text-sm font-semibold text-[#4a362c]">
                {currentShift.timeRange}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <section className="flex flex-col items-center gap-2 py-1 text-center">
              <h2 className="text-[32px] font-black leading-tight text-[#2f231d]">
                Chào, {greetingName}!
              </h2>
              <p className="text-xs text-[#9f7d67]">
                Hệ thống đã sẵn sàng cho ngày làm việc hiệu quả
              </p>

              <button
                type="button"
                className="group relative mt-2 flex h-32 w-[260px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-[#b8e5d5] bg-[#a9e4d1] text-[#1f5a4b] shadow-[0_8px_24px_rgba(61,181,148,0.2)] transition hover:-translate-y-0.5"
              >
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#d7f2e8] text-2xl leading-none">
                  +
                </span>
                <span className="text-xl font-semibold">Tạo đơn hàng mới</span>
                <span className="absolute right-0 top-0 h-5 w-5 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#2ecf94]" />
              </button>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-2xl font-extrabold text-[#2f231d]">
                  <span className="material-symbols-outlined text-[#f3ab8d]">
                    storefront
                  </span>
                  Danh mục sản phẩm & dịch vụ
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCatalogTab("service")}
                    type="button"
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-bold transition ${
                      selectedCatalogTab === "service"
                        ? "bg-orange-600/80 text-white"
                        : "border border-[#eaded6] bg-white text-[#9b745b] hover:bg-[#f8f1ec]"
                    }`}
                  >
                    Dịch vụ
                  </button>
                  <button
                    onClick={() => setSelectedCatalogTab("product")}
                    type="button"
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-bold transition ${
                      selectedCatalogTab === "product"
                        ? "bg-orange-600/80 text-white"
                        : "border border-[#eaded6] bg-white text-[#9b745b] hover:bg-[#f8f1ec]"
                    }`}
                  >
                    Sản phẩm
                  </button>

                  <button
                    onClick={() => navigate("/pos/all-products")}
                    type="button"
                    className="cursor-pointer text-sm font-semibold text-orange-600/80 transition hover:text-[#bf6f40]"
                  >
                    Xem tất cả
                  </button>
                </div>
              </div>

              {(selectedCatalogTab === "service" && isServicesLoading) ||
              (selectedCatalogTab === "product" && isProductsLoading) ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                    <article
                      key={`catalog-skeleton-${index}`}
                      className="overflow-hidden rounded-2xl border border-[#f0e3dc] bg-white p-3"
                    >
                      <div className="mb-3 h-32 animate-pulse rounded-2xl bg-[#f3ebe7]" />
                      <div className="h-4 w-4/5 animate-pulse rounded bg-[#f3ebe7]" />
                      <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-[#f3ebe7]" />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="h-5 w-1/2 animate-pulse rounded bg-[#f3ebe7]" />
                        <div className="h-8 w-8 animate-pulse rounded-full bg-[#f3ebe7]" />
                      </div>
                    </article>
                  ))}
                </div>
              ) : activeLength === 0 ? (
                <div className="rounded-2xl border border-[#eaded6] bg-white p-10 text-center">
                  <p className="text-lg font-semibold text-[#3b2d25]">
                    Chưa có dữ liệu cho tab này
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateX(-${(activePage - 1) * 100}%)`,
                      }}
                    >
                      {selectedCatalogTab === "service"
                        ? servicePages.map((serviceItems, pageIndex) => (
                            <div
                              key={`service-page-${pageIndex + 1}`}
                              className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
                            >
                              {serviceItems.map((service, itemIndex) => (
                                <article
                                  key={`${service.id}-${pageIndex}-${itemIndex}`}
                                  className="group overflow-hidden rounded-2xl border border-[#f0e3dc] bg-white p-3 shadow-[0_6px_16px_rgba(108,71,42,0.08)] transition hover:-translate-y-1"
                                >
                                  <div className="mb-3 rounded-2xl bg-[#f7f3f1] p-3">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${service.iconTone}`}
                                      >
                                        <span className="material-symbols-outlined text-[20px]">
                                          {service.icon}
                                        </span>
                                      </div>

                                      <h4 className="min-w-0 flex-1 text-base font-black leading-tight text-[#2f231d]">
                                        {service.name}
                                      </h4>
                                    </div>
                                  </div>

                                  <p className="mt-1 line-clamp-1 text-sm text-[#9f7d67]">
                                    {service.description}
                                  </p>

                                  <div className="mt-3 flex items-center justify-between">
                                    <p className="text-base font-extrabold text-orange-600/80">
                                      {service.price}
                                    </p>

                                    <div className="flex items-center gap-2">
                                      <button
                                        className="cursor-pointer rounded-full border border-[#eaded6] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#8d6955] transition hover:bg-[#f8f1ec]"
                                        onClick={() =>
                                          handleOpenServiceDetail(service)
                                        }
                                        type="button"
                                      >
                                        Chi tiết
                                      </button>

                                      <button
                                        type="button"
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#f7f3f1] text-lg text-[#9f7f6b] transition hover:bg-[#efe5df]"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          ))
                        : productPages.map((productItems, pageIndex) => (
                            <div
                              key={`product-page-${pageIndex + 1}`}
                              className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
                            >
                              {productItems.map((product, itemIndex) => (
                                <article
                                  key={`${product.id}-${pageIndex}-${itemIndex}`}
                                  className="group overflow-hidden rounded-2xl border border-[#f0e3dc] bg-white p-3 shadow-[0_6px_16px_rgba(108,71,42,0.08)] transition hover:-translate-y-1"
                                >
                                  <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#f7f3f1]">
                                    <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-sm font-bold text-[#4f3d33]">
                                      Kho: {product.stock}
                                    </span>
                                    <img
                                      alt={product.name}
                                      className="h-32 w-full object-cover"
                                      src={product.image}
                                    />
                                  </div>

                                  <h4 className="line-clamp-2 min-h-10 text-lg font-black leading-tight text-[#2f231d]">
                                    {product.name}
                                  </h4>
                                  <p className="mt-1 line-clamp-1 text-sm text-[#9f7d67]">
                                    {product.description}
                                  </p>

                                  <div className="mt-3 flex items-center justify-between">
                                    <p className="text-base font-extrabold text-orange-600/80">
                                      {product.price}
                                    </p>
                                    <button
                                      type="button"
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f3f1] text-lg text-[#9f7f6b] transition hover:bg-[#efe5df]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </article>
                              ))}
                            </div>
                          ))}
                    </div>
                  </div>

                  {activeLength > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#eaded6] bg-white text-[#8d6955] transition hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={activePage === 1}
                        onClick={() => {
                          if (selectedCatalogTab === "service") {
                            setServicePage((prev) => Math.max(prev - 1, 1));
                            return;
                          }

                          setProductPage((prev) => Math.max(prev - 1, 1));
                        }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          chevron_left
                        </span>
                      </button>
                      <button
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#eaded6] bg-white text-[#8d6955] transition hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={activePage === activePages.length}
                        onClick={() => {
                          if (selectedCatalogTab === "service") {
                            setServicePage((prev) =>
                              Math.min(prev + 1, servicePages.length),
                            );
                            return;
                          }

                          setProductPage((prev) =>
                            Math.min(prev + 1, productPages.length),
                          );
                        }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#eaded6] bg-white shadow-[0_8px_20px_rgba(108,71,42,0.08)]">
              <div className="flex items-center justify-between border-b border-[#f0e3dc] px-5 py-3">
                <h3 className="flex items-center gap-2 text-xl font-extrabold text-[#2f231d]">
                  <span className="material-symbols-outlined text-[#967867]">
                    history
                  </span>
                  Giao dịch gần đây
                </h3>
                <button
                  type="button"
                  className="text-sm cursor-pointer font-semibold text-orange-600/80 transition hover:text-[#9f6e4a]"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[#f2e7df] bg-[#fffaf7] text-xs uppercase tracking-wide text-[#bf8b6b]">
                      <th className="px-6 py-3 font-semibold">Ma don</th>
                      <th className="px-6 py-3 font-semibold">Khach hang</th>
                      <th className="px-6 py-3 font-semibold">
                        Dịch vụ/ Sản phẩm
                      </th>
                      <th className="px-6 py-3 font-semibold">Tong tien</th>
                      <th className="px-6 py-3 font-semibold">Trang thai</th>
                      <th className="px-6 py-3 font-semibold">Thoi gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-[#f7ece6] text-xs text-[#5b4438]"
                      >
                        <td className="px-6 py-4 font-bold text-[#2d2018]">
                          {transaction.id}
                        </td>
                        <td className="px-6 py-4">{transaction.customer}</td>
                        <td className="max-w-[300px] truncate px-6 py-4 text-[#9f755d]">
                          {transaction.service}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#2d2018]">
                          {transaction.total}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[transaction.status]}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#a07f6b]">
                          {transaction.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <ServiceDetailModal
          onOpenChange={(open) => {
            setIsServiceDetailOpen(open);
            if (!open) {
              setSelectedService(null);
            }
          }}
          open={isServiceDetailOpen}
          service={
            selectedService
              ? {
                  name: selectedService.name,
                  minWeight: selectedService.minWeight,
                  description: selectedService.description,
                  price: selectedService.rawPrice,
                  categoryName: selectedService.categoryName,
                  maxWeight: selectedService.maxWeight,
                }
              : null
          }
        />
      </main>
    </div>
  );
};

export default PosPage;
