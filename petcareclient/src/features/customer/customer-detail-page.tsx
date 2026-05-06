import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import type { Pet, Order, Customer } from "@/lib/profile";

import { Sidebar } from "@/components/Sidebar";
import { profileService } from "@/lib/profile";

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: number }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      navigate("/login");
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  const fetchCustomerData = async (customerId: number) => {
    try {
      setLoading(true);
      setOrdersError(false);

      // Lấy thông tin khách hàng theo ID
      const customerResponse = await profileService.getCustomerById(customerId);
      setCustomer(customerResponse);
      setEditData(customerResponse);

      if (customerResponse?.customer_id) {
        // Lấy danh sách thú cưng (bắt buộc)
        try {
          const petsResponse = await profileService.getPetsByCustomer(
            customerResponse.customer_id,
          );
          setPets(petsResponse || []);
        } catch (petError) {
          console.error("Error fetching pets:", petError);
          setPets([]);
        }

        // Lấy lịch sử giao dịch
        try {
          const ordersResponse = await profileService.getOrdersByCustomer(
            customerResponse.customer_id,
          );
          setOrders(ordersResponse || []);
        } catch (orderError: any) {
          console.error("Error fetching orders:", orderError);
          setOrders([]);
          setOrdersError(true);
        }
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
      if (error.response?.status === 404) {
        toast.error("Không tìm thấy thông tin khách hàng");
      } else if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Lỗi khi tải dữ liệu");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    fetchCustomerData(Number(id));
  }, [id, isAuthenticated]);

  const handleSaveProfile = async () => {
    try {
      if (!customer?.customer_id) {
        toast.error("ID khách hàng không tìm thấy");
        return;
      }
      const updated = await profileService.updateCustomer(
        customer.customer_id,
        editData,
      );
      setCustomer(updated);
      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
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
    };
    const statusTextMap: Record<string, string> = {
      PAID: "Đã thanh toán",
      CANCELLED: "Đã hủy",
      PENDING: "Chờ xử lý",
      PROCESSING: "Đang xử lý",
      COMPLETED: "Hoàn thành",
    };
    return {
      color: statusMap[status] || "bg-gray-100 text-gray-700",
      text: statusTextMap[status] || status,
    };
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    return order.status === activeFilter;
  });

  const totalSpent = customer?.total_spend
    ? Number(customer.total_spend)
    : orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;

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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Chi tiết Khách hàng
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg">
            <p className="text-gray-600 mb-4">
              Không tìm thấy thông tin khách hàng
            </p>
            <button
              onClick={() => {
                navigate("/customers");
              }}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
              <h1 className="text-2xl font-bold text-gray-800">
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
              <button
                onClick={() =>
                  navigate(`/orders/create?customerId=${customer.customer_id}`)
                }
                className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tạo đơn mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-3xl font-bold">
                    {customer.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{customer.full_name}</h2>
                    <p className="text-sm opacity-90">Khách hàng thân thiết</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên khách hàng
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          value={editData.phone || ""}
                          disabled
                          className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Số điện thoại không thể thay đổi
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editData.email || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition font-medium"
                      >
                        Lưu thay đổi
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Số điện thoại
                        </p>
                        <p className="font-medium text-gray-800">
                          {customer.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Địa chỉ
                        </p>
                        <p className="font-medium text-gray-700 text-sm">
                          {customer.address || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Ngày tham gia
                        </p>
                        <p className="font-medium text-gray-800">
                          {formatDate(customer.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Email</p>
                        <p className="font-medium text-gray-700 text-sm">
                          {customer.email || "-"}
                        </p>
                      </div>
                      <div className="pt-4 border-t mt-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                          <p className="text-xl font-bold text-orange-600">
                            {formatCurrency(totalSpent)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-600">Số đơn hàng</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {totalOrders}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pets & Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pets Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span>🐕</span> Thú cưng ({pets.length})
                </h3>
                <button
                  onClick={() =>
                    navigate(`/pets/create?customerId=${customer.customer_id}`)
                  }
                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Thêm mới
                </button>
              </div>
              <div className="p-6">
                {pets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pets.map((pet) => (
                      <div
                        key={pet.pet_id}
                        onClick={() => navigate(`/pets/${pet.pet_id}`)}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 hover:shadow-md cursor-pointer transition transform hover:scale-105"
                      >
                        <div className="flex items-start gap-3">
                          {pet.avatar_url ? (
                            <img
                              src={pet.avatar_url}
                              alt={pet.pet_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="text-4xl">
                              {pet.species === "DOG" ? "🐕" : "🐈"}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {pet.pet_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {pet.breed || "Không rõ giống"}
                            </p>
                            {pet.weight && (
                              <p className="text-xs text-gray-500 mt-1">
                                ⚖️ {pet.weight} kg
                              </p>
                            )}
                            {pet.age && (
                              <p className="text-xs text-gray-500">
                                🎂 {pet.age} tuổi
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🐕</div>
                    <p className="text-gray-500">Chưa có thú cưng nào</p>
                    <button
                      onClick={() =>
                        navigate(
                          `/pets/create?customerId=${customer.customer_id}`,
                        )
                      }
                      className="mt-3 text-orange-500 text-sm hover:underline flex items-center gap-1 mx-auto"
                    >
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Thêm thú cưng đầu tiên
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order History Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">📋 Lịch sử giao dịch</h3>
                {orders.length > 0 && (
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                )}
              </div>

              {ordersError && orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Không thể tải lịch sử giao dịch
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Vui lòng thử lại sau
                  </p>
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-600">
                          NGÀY
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-600">
                          DỊCH VỤ/SẢN PHẨM
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-600">
                          TỔNG TIỀN
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-gray-600">
                          TRẠNG THÁI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.order_id}
                          className="border-b hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => navigate(`/orders/${order.order_id}`)}
                        >
                          <td className="p-4 text-sm text-gray-700">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="p-4">
                            {order.order_details &&
                            order.order_details.length > 0 ? (
                              <div className="space-y-1">
                                {order.order_details.map((detail) => (
                                  <div key={detail.id} className="text-sm">
                                    <span className="font-medium text-gray-800">
                                      {detail.name}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-2">
                                      x{detail.quantity}
                                    </span>
                                    {detail.pet_name && (
                                      <span className="text-xs text-gray-400 ml-2">
                                        (Cho {detail.pet_name})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-gray-800">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status).color}`}
                            >
                              {getStatusColor(order.status).text}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500">Chưa có giao dịch nào</p>
                </div>
              )}

              {filteredOrders.length > 0 &&
                filteredOrders.length < orders.length && (
                  <div className="text-center py-4 border-t">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className="text-orange-500 text-sm hover:underline"
                    >
                      Xem tất cả {orders.length} giao dịch
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
