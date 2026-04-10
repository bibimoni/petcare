import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import {
  getPosProducts,
  getPosServices,
  type PosService,
  getPosProductCategories,
  getPosServiceCategories,
} from "@/features/pos/api/pos.api";
import { sidebarUser } from "@/lib/user";

import { ServiceDetailModal } from "./service-detail-modal";

const chunkItems = <T,>(items: T[], pageSize: number): T[][] => {
  if (items.length === 0) {
    return [];
  }

  const pages: T[][] = [];

  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }

  return pages;
};

const AllProductsPage = () => {
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 5;

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedServiceCategory, setSelectedServiceCategory] =
    useState<string>("all");
  const [servicePage, setServicePage] = useState(1);
  const [isServiceDetailOpen, setIsServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PosService | null>(
    null,
  );

  const [selectedProductCategory, setSelectedProductCategory] =
    useState<string>("all");
  const [productPage, setProductPage] = useState(1);
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ["pos-service-categories"],
    queryFn: getPosServiceCategories,
  });

  const { data: productCategories = [] } = useQuery({
    queryKey: ["pos-product-categories"],
    queryFn: getPosProductCategories,
  });

  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ["pos-services", selectedServiceCategory],
    queryFn: () => getPosServices(selectedServiceCategory),
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["pos-products", selectedProductCategory],
    queryFn: () => getPosProducts(selectedProductCategory),
  });

  const serviceTabs = useMemo(() => {
    const fromApi = serviceCategories.map((category) => ({
      id: String(category.category_id),
      label: String(category.name ?? "Dịch vụ"),
    }));

    return [{ id: "all", label: "Tất cả" }, ...fromApi];
  }, [serviceCategories]);

  const serviceCategoryNameMap = useMemo(() => {
    return serviceCategories.reduce<Record<string, string>>((acc, category) => {
      acc[String(category.category_id)] = String(category.name ?? "Khác");
      return acc;
    }, {});
  }, [serviceCategories]);

  const selectedServiceCategoryName = selectedService
    ? (serviceCategoryNameMap[String(selectedService.categoryId)] ?? "Khác")
    : "Khác";

  const productTabs = useMemo(() => {
    const fromApi = productCategories.map((category) => ({
      id: String(category.category_id),
      label: String(category.name ?? "Danh mục"),
    }));

    return [{ id: "all", label: "Tất cả" }, ...fromApi];
  }, [productCategories]);

  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) {
      return services;
    }

    const keyword = searchTerm.toLowerCase();

    return services.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword),
    );
  }, [searchTerm, services]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const keyword = searchTerm.toLowerCase();

    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword),
    );
  }, [searchTerm, products]);

  const servicePages = useMemo(
    () => chunkItems(filteredServices, ITEMS_PER_PAGE),
    [ITEMS_PER_PAGE, filteredServices],
  );

  const productPages = useMemo(
    () => chunkItems(filteredProducts, ITEMS_PER_PAGE),
    [ITEMS_PER_PAGE, filteredProducts],
  );

  useEffect(() => {
    setServicePage(1);
  }, [searchTerm, selectedServiceCategory]);

  useEffect(() => {
    setProductPage(1);
  }, [searchTerm, selectedProductCategory]);

  useEffect(() => {
    const maxPage = Math.max(servicePages.length, 1);
    if (servicePage > maxPage) {
      setServicePage(maxPage);
    }
  }, [servicePage, servicePages.length]);

  useEffect(() => {
    const maxPage = Math.max(productPages.length, 1);
    if (productPage > maxPage) {
      setProductPage(maxPage);
    }
  }, [productPage, productPages.length]);

  const handleOpenServiceDetail = (service: PosService) => {
    setSelectedService(service);
    setIsServiceDetailOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar userInfo={sidebarUser} />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 border-b border-[#f0e6df] bg-[#faf7f5]/90 px-8 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <button
              className="flex cursor-pointer items-center gap-1 text-sm font-semibold uppercase tracking-wide text-[#9b745b] transition hover:text-[#6f4c3a]"
              onClick={() => navigate("/pos")}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                chevron_left
              </span>
              Quay lại
            </button>

            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cb8f6a]">
                POS
              </p>
              <h1 className="text-lg font-bold text-[#2f231d]">
                Danh mục bán hàng
              </h1>
            </div>
          </div>

          <div className="hidden w-full max-w-3xl items-center gap-3 md:flex">
            <div className="relative w-full">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#be9477]">
                search
              </span>
              <input
                className="h-11 w-full rounded-full border border-[#ecdcd1] bg-[#fdfaf8] pl-12 pr-4 text-sm text-[#523c30] outline-none transition focus:border-[#dcae8c] focus:ring-2 focus:ring-[#f3d8c4]"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm sản phẩm, dịch vụ hoặc khách hàng"
                type="text"
                value={searchTerm}
              />
            </div>

            <button
              className="whitespace-nowrap rounded-2xl cursor-pointer bg-orange-600/80 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
              type="button"
            >
              + Tạo hoá đơn
            </button>
          </div>

          <button
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#ecdcd1] bg-white text-[#7a5f50]"
            type="button"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <section className="mb-10 border-b border-[#eaded6] pb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-3xl font-extrabold text-[#2f231d]">
                <span className="material-symbols-outlined text-[#f3ab8d]">
                  spa
                </span>
                Dịch vụ
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                {serviceTabs.map((tab) => {
                  const isActive = selectedServiceCategory === tab.id;

                  return (
                    <button
                      className={`rounded-2xl border cursor-pointer px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-[#2d1f16] bg-[#1f140f] text-white"
                          : "border-[#e8ddd6] bg-white text-[#3b2d25] hover:bg-[#f4eeea]"
                      }`}
                      key={tab.id}
                      onClick={() => setSelectedServiceCategory(tab.id)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isServicesLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <article
                    className="overflow-hidden rounded-3xl border border-[#f0e3dc] bg-white p-3"
                    key={`service-skeleton-${index}`}
                  >
                    <div className="mb-3 h-40 animate-pulse rounded-2xl bg-[#f3ebe7]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#f3ebe7]" />
                    <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-[#f3ebe7]" />
                    <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-[#f3ebe7]" />
                  </article>
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="rounded-3xl border border-[#eaded6] bg-white p-10 text-center">
                <p className="text-lg font-semibold text-[#3b2d25]">
                  Không có dịch vụ trong danh mục này
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(-${(servicePage - 1) * 100}%)`,
                    }}
                  >
                    {servicePages.map((serviceItems, pageIndex) => (
                      <div
                        className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
                        key={`service-page-${pageIndex + 1}`}
                      >
                        {serviceItems.map((service, itemIndex) => (
                          <article
                            className="rounded-3xl border border-[#f0e3dc] bg-white p-4 shadow-[0_6px_16px_rgba(108,71,42,0.08)]"
                            key={`${service.id}-${pageIndex}-${itemIndex}`}
                          >
                            <div>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${service.iconTone}`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    {service.icon}
                                  </span>
                                </div>

                                <h4 className="min-w-0 flex-1 text-base font-extrabold leading-tight text-[#2f231d]">
                                  {service.name}
                                </h4>

                                <button
                                  className="flex h-8 w-8 cursor-pointer shrink-0 items-center justify-center rounded-full bg-[#f7f3f1] text-xl text-[#9f7f6b] transition hover:bg-[#efe5df]"
                                  type="button"
                                >
                                  +
                                </button>
                              </div>

                              <p className="mt-2 line-clamp-1 text-xs text-[#9f7d67]">
                                {service.description}
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <p className="text-lg font-extrabold text-orange-600/80">
                                  {service.price}
                                </p>

                                <div className="flex items-center gap-2">
                                  <button
                                    className="rounded-full cursor-pointer border border-[#eaded6] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#8d6955] transition hover:bg-[#f8f1ec]"
                                    onClick={() =>
                                      handleOpenServiceDetail(service)
                                    }
                                    type="button"
                                  >
                                    Chi tiết
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {filteredServices.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#eaded6] bg-white text-[#8d6955] transition hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={servicePage === 1}
                      onClick={() =>
                        setServicePage((prev) => Math.max(prev - 1, 1))
                      }
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#eaded6] bg-white text-[#8d6955] transition hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={servicePage === servicePages.length}
                      onClick={() =>
                        setServicePage((prev) =>
                          Math.min(prev + 1, servicePages.length),
                        )
                      }
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

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-3xl font-extrabold text-[#2f231d]">
                <span className="material-symbols-outlined text-[#f3ab8d]">
                  inventory_2
                </span>
                Sản phẩm
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                {productTabs.map((tab) => {
                  const isActive = selectedProductCategory === tab.id;

                  return (
                    <button
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-[#2d1f16] bg-[#1f140f] text-white"
                          : "border-[#e8ddd6] bg-white text-[#3b2d25] hover:bg-[#f4eeea]"
                      }`}
                      key={tab.id}
                      onClick={() => setSelectedProductCategory(tab.id)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isProductsLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <article
                    className="overflow-hidden rounded-3xl border border-[#f0e3dc] bg-white p-3"
                    key={`product-skeleton-${index}`}
                  >
                    <div className="mb-3 h-40 animate-pulse rounded-2xl bg-[#f3ebe7]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#f3ebe7]" />
                    <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-[#f3ebe7]" />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-5 w-1/2 animate-pulse rounded bg-[#f3ebe7]" />
                      <div className="h-8 w-8 animate-pulse rounded-full bg-[#f3ebe7]" />
                    </div>
                  </article>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-[#eaded6] bg-white p-10 text-center">
                <p className="text-lg font-semibold text-[#3b2d25]">
                  Không có sản phẩm trong danh mục này
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(-${(productPage - 1) * 100}%)`,
                    }}
                  >
                    {productPages.map((productItems, pageIndex) => (
                      <div
                        className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
                        key={`product-page-${pageIndex + 1}`}
                      >
                        {productItems.map((product, itemIndex) => (
                          <article
                            className="group overflow-hidden rounded-3xl border border-[#f0e3dc] bg-white p-3 shadow-[0_6px_16px_rgba(108,71,42,0.08)] transition hover:-translate-y-1"
                            key={`${product.id}-${pageIndex}-${itemIndex}`}
                          >
                            <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#f7f3f1]">
                              <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-sm font-bold text-[#4f3d33]">
                                Kho: {product.stock}
                              </span>
                              <img
                                alt={product.name}
                                className="h-40 w-full object-cover"
                                src={product.image}
                              />
                            </div>

                            <h4 className="line-clamp-2 min-h-10 text-xl font-black leading-tight text-[#2f231d]">
                              {product.name}
                            </h4>
                            <p className="mt-1 line-clamp-1 text-sm text-[#9f7d67]">
                              {product.description}
                            </p>

                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-lg font-extrabold text-orange-600/80">
                                {product.price}
                              </p>
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3f1] text-xl text-[#9f7f6b] transition hover:bg-[#efe5df]"
                                type="button"
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

                {filteredProducts.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eaded6] bg-white text-[#8d6955] transition hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={productPage === 1}
                      onClick={() =>
                        setProductPage((prev) => Math.max(prev - 1, 1))
                      }
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eaded6] bg-white text-[#8d6955] transition hover:bg-[#f5ebe5] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={productPage === productPages.length}
                      onClick={() =>
                        setProductPage((prev) =>
                          Math.min(prev + 1, productPages.length),
                        )
                      }
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
                  description: selectedService.description,
                  minWeight: selectedService.minWeight,
                  price: selectedService.rawPrice,
                  categoryName: selectedServiceCategoryName,
                  maxWeight: selectedService.maxWeight,
                }
              : null
          }
        />
      </main>
    </div>
  );
};

export default AllProductsPage;
