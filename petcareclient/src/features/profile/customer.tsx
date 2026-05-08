import { Phone, MapPin, Calendar, PawPrint } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import {
  CustomerApi,
  type CustomerListItem,
} from "@/features/customer/api/customer-api";
import { RevenueChart } from "@/features/dashboard/components/revenue-chart";
import { getOrders, type OrderListItemDto } from "@/features/pos/api/pos.api";
import { CancelledOrderModal } from "@/features/pos/cancelled-order-modal";
import { OrderDetailModal } from "@/features/pos/completed-order-modal";
import { PendingOrderModal } from "@/features/pos/pending-order-modal";
import { RefundedOrderModal } from "@/features/pos/refunded-order-modal";
import { PetService } from "@/lib/pets";

interface LocalPet {
  age?: number;
  breed: string;
  pet_id: number;
  species: string;
  weight?: number;
  pet_name: string;
  avatar_url?: string;
}

interface LocalOrderDetail {
  id: number;
  name: string;
  quantity: number;
  subtotal: number;
  pet_name?: string;
  unit_price: number;
}

interface LocalOrder {
  status: string;
  order_id: number;
  created_at: string;
  total_amount: number;
  order_details: LocalOrderDetail[];
}

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const phoneFromUrl = searchParams.get("phone");

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CustomerListItem>>({});
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      navigate("/login");
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  // Customer Query
  const customerQuery = useQuery({
    queryKey: ["customer", id || phoneFromUrl],
    queryFn: async () => {
      if (id) {
        return CustomerApi.getCustomer(id);
      }
      if (phoneFromUrl) {
        const allCustomers = await CustomerApi.getCustomers();
        return allCustomers.find((c) => c.phone === phoneFromUrl) || null;
      }
      return null;
    },
    enabled: !!(id || phoneFromUrl),
  });

  const customer = customerQuery.data as CustomerListItem | null;
  const customerId = customer?.customer_id || customer?.id;

  // Sync editData when customer data is loaded
  useEffect(() => {
    if (customer) {
      setEditData(customer);
    }
  }, [customer]);

  // Pets Query
  const petsQuery = useQuery({
    queryKey: ["customer-pets", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const petsRes = await PetService.getByCustomer(Number(customerId));
      const petsArray = Array.isArray(petsRes)
        ? petsRes
        : petsRes?.data && Array.isArray(petsRes.data)
          ? petsRes.data
          : [];

      return petsArray.map((item: any) => ({
        pet_id: item.pet_id || item.id,
        pet_name: item.name || item.pet_name,
        breed: item.breed || "",
        species:
          item.species ||
          (item.breed?.toLowerCase().includes("chó") ? "DOG" : "CAT"),
        age: item.age,
        weight: item.weight,
        avatar_url: item.avatar_url || item.image_url,
      }));
    },
    enabled: !!customerId,
  });

  const pets = (petsQuery.data || []) as LocalPet[];

  // Orders Query
  const ordersQuery = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const ordersRes = await getOrders(1, 1000, {
        customer_id: Number(customerId),
      });
      return (ordersRes.data || []).map((item: OrderListItemDto) => ({
        order_id: item.order_id,
        created_at: item.created_at,
        total_amount: Number(item.total_amount),
        status: item.status,
        order_details: (item.order_details || []).map((detail: any) => ({
          id: detail.id,
          name:
            detail.item_type === "SERVICE"
              ? (detail.service?.combo_name ?? "Dịch vụ")
              : (detail.product?.name ?? "Sản phẩm"),
          quantity: detail.quantity,
          unit_price: Number(detail.unit_price),
          subtotal: Number(detail.subtotal),
          pet_name: detail.pet?.name,
        })),
      }));
    },
    enabled: !!customerId,
  });

  const orders = (ordersQuery.data || []) as LocalOrder[];

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return CustomerApi.editCustomer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer", id || phoneFromUrl],
      });
      queryClient.invalidateQueries({ queryKey: ["customers-list"] });
      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
    },
  });

  const handleSaveProfile = () => {
    if (!customerId) {
      toast.error("ID khách hàng không tìm thấy");
      return;
    }

    const payload = {
      id: String(customerId),
      fullName: editData.full_name || editData.fullName,
      email: editData.email,
      address: editData.address,
      notes: editData.notes,
    };

    updateMutation.mutate(payload);
  };

  const loading = customerQuery.isPending || updateMutation.isPending;

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "-";
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString("vi-VN");
    }
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PAID: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PROCESSING: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-green-100 text-green-700",
      REFUNDED: "bg-blue-100 text-blue-700",
    };
    const statusTextMap: Record<string, string> = {
      PAID: "Đã thanh toán",
      CANCELLED: "Đã hủy",
      PENDING: "Chờ xử lý",
      PROCESSING: "Đang xử lý",
      COMPLETED: "Hoàn thành",
      REFUNDED: "Đã hoàn tiền",
    };
    return {
      color: statusMap[status] || "bg-gray-100 text-gray-700",
      text: statusTextMap[status] || status,
    };
  };

  const getOrderStatus = (status: string, cancel_reason?: string | null) => {
    if (status === "CANCELLED") {
      if (cancel_reason === "Refunded") {
        return "REFUNDED";
      }
    }
    if (status === "PAID" || status === "COMPLETED") return "PAID";
    return status;
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    return order.status === activeFilter;
  });

  const totalSpent = useMemo(() => {
    return orders
      .filter(
        (order) => order.status === "PAID" || order.status === "COMPLETED",
      )
      .reduce((sum, order) => sum + order.total_amount, 0);
  }, [orders]);

  const chartData = useMemo(() => {
    const months = [];
    const values = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = `T${d.getMonth() + 1}`;
      months.push(monthLabel);

      const monthTotal = orders
        .filter((order) => {
          const orderDate = new Date(order.created_at);
          return (
            orderDate.getMonth() === d.getMonth() &&
            orderDate.getFullYear() === d.getFullYear() &&
            (order.status === "PAID" || order.status === "COMPLETED")
          );
        })
        .reduce((sum, order) => sum + order.total_amount, 0);

      values.push(monthTotal);
    }

    return {
      days: months,
      values: values,
      totalWeekly: formatCurrency(totalSpent),
    };
  }, [orders, totalSpent]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex w-full overflow-hidden h-screen bg-[#faf7f5]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="bg-[#faf7f5] border-b border-[#eddcd3]">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Tra cứu khách hàng
              </h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center bg-white p-6 rounded-lg shadow-lg">
              <p className="text-gray-600 mb-4">
                Không tìm thấy thông tin khách hàng
              </p>
              <button
                onClick={() => {
                  navigate("/customers");
                }}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
              >
                Tìm kiếm lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf7f5]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        {/* Page Secondary Header */}
        <div className="bg-[#faf7f5] border-b border-[#eddcd3] sticky top-0 z-10">
          <div className="max-w-full mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    navigate("/customers");
                  }}
                  className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Quay lại
                </button>
                <h1 className="text-xl font-bold text-gray-800">
                  Chi tiết Khách hàng
                </h1>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 text-orange-500 text-sm px-4 py-2 hover:bg-orange-50 rounded-lg transition"
                >
                  {isEditing ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Hủy
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Sửa thông tin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer Info & Pets */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl font-bold text-orange-200 border-2 border-dashed border-orange-200">
                          {editData.full_name?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          value={editData.full_name || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              full_name: e.target.value,
                            })
                          }
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Địa chỉ
                        </label>
                        <input
                          type="text"
                          value={editData.address || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              address: e.target.value,
                            })
                          }
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editData.email || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-bold mt-4 shadow-lg shadow-orange-200"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt={customer.full_name}
                            className="w-16 h-16 rounded-2xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-gray-300">
                            {customer.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-black text-gray-800 tracking-tight">
                            {customer.full_name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-400 text-xs font-medium">
                              #KH
                              {String(
                                customer.customer_id || customer.id,
                              ).padStart(3, "0")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                            <Phone size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              Số điện thoại
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                              {customer.phone || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 shadow-sm">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              Địa chỉ
                            </p>
                            <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed">
                              {customer.address || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              Ngày tham gia
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                              {formatDate(customer.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pets Section */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-50">
                  <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                    <span className="text-lg">🐾</span> Thú cưng của{" "}
                    {customer.full_name?.split(" ").pop()} ({pets.length})
                  </h3>
                </div>
                <div className="p-6">
                  {pets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {pets.map((pet) => (
                        <div
                          key={pet.pet_id}
                          onClick={() => navigate(`/pets/${pet.pet_id}`)}
                          className="group cursor-pointer"
                        >
                          <div className="relative aspect-square rounded-3xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-300">
                            {pet.avatar_url ? (
                              <img
                                src={pet.avatar_url}
                                alt={pet.pet_name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-yellow-50 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                                {pet.species === "DOG" ? "🐕" : "🐈"}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                              {pet.pet_name}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              {pet.breed || "Không rõ giống"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PawPrint className="text-gray-200" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">
                        Chưa có thú cưng nào
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Chart & Orders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Spending Chart Card */}
              <div className="bg-white">
                <RevenueChart
                  data={chartData}
                  titleText="Biểu đồ chi tiêu"
                  noteText="Tổng chi tiêu"
                  period="year"
                  selectedYear={new Date().getFullYear()}
                  onYearChange={() => { }}
                  onPeriodChange={() => { }}
                />
              </div>

              {/* Order History Section */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="flex justify-between items-center p-5 border-b">
                  <h3 className="text-xl font-bold text-gray-800">
                    Lịch sử giao dịch
                  </h3>
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="all">Tất cả dịch vụ</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="REFUNDED">Đã hoàn tiền</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Ngày</th>
                        <th className="px-4 py-3">Dịch vụ/Sản phẩm</th>
                        <th className="px-4 py-3">Tổng tiền</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.slice(0, 3).map((order) => (
                          <tr
                            key={order.order_id}
                            className="hover:bg-gray-50 cursor-pointer transition-colors group"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-gray-800">
                                {formatDate(order.created_at)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.created_at).toLocaleTimeString(
                                  "vi-VN",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {order.order_details
                                  .slice(0, 2)
                                  .map((detail) => (
                                    <div key={detail.id} className="text-sm">
                                      <span className="font-bold text-gray-700">
                                        {detail.name}
                                      </span>
                                      {detail.pet_name && (
                                        <span className="text-xs text-gray-400 ml-1">
                                          Cho {detail.pet_name}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                {order.order_details.length > 2 && (
                                  <p className="text-xs text-orange-500">
                                    + {order.order_details.length - 2} mục khác
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-black text-gray-800">
                                {formatCurrency(order.total_amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status).color}`}
                              >
                                {getStatusColor(order.status).text}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center">
                            <div className="text-gray-400">
                              <p className="font-medium text-gray-600 mb-2">
                                Không có dữ liệu
                              </p>
                              <p className="text-sm">Chưa có giao dịch nào</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredOrders.length > 4 && (
                  <div className="p-4 border-t text-center">
                    <button
                      onClick={() => navigate("/pos/history")}
                      className="text-orange-500 text-sm font-bold hover:underline"
                    >
                      Xem toàn bộ lịch sử
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <OrderDetailModal
          isOpen={
            !!selectedOrder && getOrderStatus(selectedOrder.status) === "PAID"
          }
          orderId={selectedOrder?.order_id || null}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={() => {
            setSelectedOrder(null);
          }}
        />

        <PendingOrderModal
          isOpen={!!selectedOrder && selectedOrder.status === "PENDING"}
          orderId={selectedOrder?.order_id || null}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={() => {
            setSelectedOrder(null);
          }}
        />

        <CancelledOrderModal
          isOpen={!!selectedOrder && selectedOrder.status === "CANCELLED"}
          orderId={selectedOrder?.order_id || null}
          onClose={() => setSelectedOrder(null)}
        />

        <RefundedOrderModal
          isOpen={
            !!selectedOrder &&
            getOrderStatus(
              selectedOrder.status,
              (selectedOrder as any).cancel_reason,
            ) === "REFUNDED"
          }
          orderId={selectedOrder?.order_id || null}
          onClose={() => setSelectedOrder(null)}
        />
        <Footer />
      </main>
    </div>
  );
}
