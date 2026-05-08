import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { 
  Store, 
  ChevronLeft, 
  ChevronRight, 
  History, 
  Bath, 
  Scissors, 
  Stethoscope, 
  Home, 
  PawPrint 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import {
  getOrders,
  type PosProduct,
  type PosService,
  getPosCatalogOverview,
  type OrderListItemDto,
} from "@/features/pos/api";
import { useSearch } from "@/lib/search-context";
import { getSidebarUser } from "@/lib/user";

import { CancelledOrderModal } from "./cancelled-order-modal";
import { OrderDetailModal } from "./completed-order-modal";
import { ServiceDetailModal } from "./components/service-detail-modal";
import { PendingOrderModal } from "./pending-order-modal";
import { RefundedOrderModal } from "./refunded-order-modal";

export type OrderItem = {
  id: string;
  name: string;
  price: string;
  cartKey: string;
  quantity: number;
  numericPrice: number;
  type: "service" | "product";
};

type HistoryTransaction = {
  id: string;
  pet: string;
  date: string;
  time: string;
  total: string;
  numericId: number;
  customerName: string;
  customerPhone: string;
  cancel_reason?: string;
  customerInitials: string;
  status: "PAID" | "CANCELLED" | "PENDING" | "REFUNDED";
};

const formatVND = (value: string | number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value))}đ`;

const toDateParts = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

const getCustomerInitials = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed) return "KL";
  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const summarizeOrderItems = (
  orderDetails: OrderListItemDto["order_details"],
) => {
  if (orderDetails.length === 0) return "Không có mặt hàng";
  const firstItem = orderDetails[0];
  const firstName =
    firstItem.item_type === "SERVICE"
      ? (firstItem.service?.combo_name ?? "Dịch vụ")
      : (firstItem.product?.name ?? "Sản phẩm");
  if (orderDetails.length === 1) {
    return `${firstName} x${firstItem.quantity}`;
  }
  return `${firstName} x${firstItem.quantity} +${orderDetails.length - 1} mục khác`;
};

const mapOrderToHistoryTransaction = (
  order: OrderListItemDto,
): HistoryTransaction => {
  const customerName = order.customer?.full_name ?? "Khách lẻ";
  const phone = order.customer?.phone ?? "--";
  const { date, time } = toDateParts(order.created_at);
  return {
    customerInitials: getCustomerInitials(customerName),
    customerName,
    customerPhone: phone,
    date,
    id: `POS-${String(order.order_id).padStart(4, "0")}`,
    numericId: order.order_id,
    pet: summarizeOrderItems(order.order_details),
    status:
      order.status === "CANCELLED" && order.cancel_reason === "Refunded"
        ? "REFUNDED"
        : (order.status as "PAID" | "CANCELLED" | "PENDING"),
    time,
    total: formatVND(order.total_amount),
  };
};

const ICON_MAP: Record<string, any> = {
  shower: Bath,
  content_cut: Scissors,
  medical_services: Stethoscope,
  home: Home,
  pets: PawPrint,
};

const PosPage = () => {
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 5;
  const { searchQuery } = useSearch();

  const [selectedCatalogTab, setSelectedCatalogTab] = useState<
    "service" | "product"
  >("service");
  const [servicePage, setServicePage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [isServiceDetailOpen, setIsServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PosService | null>(
    null,
  );

  const { data: profile } = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: getSidebarUser,
  });

  const { data: catalogData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ["pos-catalog-overview"],
    queryFn: getPosCatalogOverview,
  });

  const services = catalogData?.services ?? [];
  const hotProducts = catalogData?.products ?? [];
  const [selectedTx, setSelectedTx] = useState<HistoryTransaction | null>(null);
  const { data: recentOrdersData } = useQuery({
    queryKey: ["pos-recent-orders"],
    queryFn: () => getOrders(1, 4),
  });



  const greetingName = useMemo(() => {
    const fullName = profile?.full_name?.trim();
    if (fullName) {
      return fullName;
    }

    return "Bạn";
  }, [profile?.full_name]);



  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return services;
    }
    const keyword = searchQuery.toLowerCase();
    return services.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword),
    );
  }, [searchQuery, services]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return hotProducts;
    }
    const keyword = searchQuery.toLowerCase();
    return hotProducts.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword),
    );
  }, [searchQuery, hotProducts]);

  const servicePages = useMemo(() => {
    if (filteredServices.length === 0) {
      return [];
    }

    const pages: PosService[][] = [];

    for (
      let index = 0;
      index < filteredServices.length;
      index += ITEMS_PER_PAGE
    ) {
      pages.push(filteredServices.slice(index, index + ITEMS_PER_PAGE));
    }

    return pages;
  }, [filteredServices]);

  const productPages = useMemo(() => {
    if (filteredProducts.length === 0) {
      return [];
    }

    const pages: PosProduct[][] = [];

    for (
      let index = 0;
      index < filteredProducts.length;
      index += ITEMS_PER_PAGE
    ) {
      pages.push(filteredProducts.slice(index, index + ITEMS_PER_PAGE));
    }

    return pages;
  }, [filteredProducts]);

  const recentTransactions = useMemo(() => {
    const orders = recentOrdersData?.data ?? [];
    return orders.map(mapOrderToHistoryTransaction);
  }, [recentOrdersData?.data]);
  const activePage =
    selectedCatalogTab === "service" ? servicePage : productPage;
  const activePages =
    selectedCatalogTab === "service" ? servicePages : productPages;
  const activeLength =
    selectedCatalogTab === "service"
      ? filteredServices.length
      : filteredProducts.length;

  useEffect(() => {
    setServicePage(1);
    setProductPage(1);
  }, [searchQuery]);

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

  const handleAddItem = (
    item: PosService | PosProduct,
    type: "service" | "product",
  ) => {
    navigate("/pos/all-products", {
      state: { addedItem: { item, type } },
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <Header />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <section className="flex flex-col items-center gap-2 py-1 text-center">
              <h2 className="text-[32px] font-black leading-tight text-[#2f231d]">
                Chào, {greetingName}!
              </h2>
              <p className="text-xs text-[#9f7d67]">
                Hệ thống đã sẵn sàng cho ngày làm việc hiệu quả
              </p>

              <button
                onClick={() =>
                  navigate("/pos/all-products", {
                    state: { openCreateOrder: true },
                  })
                }
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
                  <Store className="text-[#f3ab8d] w-6 h-6" />
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

              {isCatalogLoading ? (
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
                                        {(() => {
                                          const IconComponent = ICON_MAP[service.icon] || PawPrint;
                                          return <IconComponent className="w-5 h-5" />;
                                        })()}
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
                                        onClick={() =>
                                          handleAddItem(service, "service")
                                        }
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
                                      onClick={() =>
                                        handleAddItem(product, "product")
                                      }
                                      type="button"
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#f7f3f1] text-lg text-[#9f7f6b] transition hover:bg-[#efe5df]"
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
                        <ChevronLeft className="w-[18px] h-[18px]" />
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
                        <ChevronRight className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#eaded6] bg-white shadow-[0_8px_20px_rgba(108,71,42,0.08)]">
              <div className="flex items-center justify-between border-b border-[#f0e3dc] px-5 py-3">
                <h3 className="flex items-center gap-2 text-xl font-extrabold text-[#2f231d]">
                  <History className="text-[#967867] w-5 h-5" />
                  Giao dịch gần đây
                </h3>
                <button
                  onClick={() => navigate("/pos/history")}
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
                      <th className="px-6 py-3 font-semibold">Mã đơn</th>
                      <th className="px-6 py-3 font-semibold">Khách hàng</th>
                      <th className="px-6 py-3 font-semibold">
                        Dịch vụ/ Sản phẩm
                      </th>
                      <th className="px-6 py-3 font-semibold">Tổng tiền</th>
                      <th className="px-6 py-3 font-semibold">Trạng thái</th>
                      <th className="px-6 py-3 font-semibold">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        onClick={() => setSelectedTx(transaction)}
                        className="cursor-pointer border-b border-[#f7ece6] text-xs text-[#5b4438] hover:bg-[#fcfafa] transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-[#2d2018]">
                          {transaction.id}
                        </td>
                        <td className="px-6 py-4">
                          {transaction.customerName}
                        </td>
                        <td className="max-w-[300px] truncate px-6 py-4 text-[#9f755d]">
                          {transaction.pet}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#2d2018]">
                          {transaction.total}
                        </td>
                        <td className="px-6 py-4">
                          {transaction.status === "PAID" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7f1] px-2.5 py-1 text-[10px] font-bold text-[#1f8c6e]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#1f8c6e]"></span>
                              Đã thanh toán
                            </div>
                          )}
                          {transaction.status === "PENDING" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-100 px-2.5 py-1 text-[10px] font-bold text-yellow-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                              Chờ thanh toán
                            </div>
                          )}
                          {transaction.status === "REFUNDED" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              Đã hoàn tiền
                            </div>
                          )}
                          {transaction.status === "CANCELLED" && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              Đã hủy
                            </div>
                          )}
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
          <Footer />
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

        <OrderDetailModal
          isOpen={selectedTx?.status === "PAID"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
          onStatusChange={() => {}}
        />

        <PendingOrderModal
          isOpen={selectedTx?.status === "PENDING"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
          onStatusChange={() => {}}
        />

        <CancelledOrderModal
          isOpen={selectedTx?.status === "CANCELLED"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
        />

        <RefundedOrderModal
          isOpen={selectedTx?.status === "REFUNDED"}
          orderId={selectedTx?.numericId || null}
          onClose={() => setSelectedTx(null)}
        />
      </main>
    </div>
  );
};

export default PosPage;
