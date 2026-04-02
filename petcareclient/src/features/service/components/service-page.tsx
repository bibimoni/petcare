import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import {
  Search,
  Plus,
  WashingMachine,
  Scissors,
  Home,
  Syringe,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  X,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

interface ServiceCategory {
  category_id: number;
  name: string;
}

interface PetService {
  id: number;
  store_id: number;
  category_id: number;
  combo_name: string;
  price: number;
  duration_minutes: number | null;
  description: string;
  status: "ACTIVE" | "ARCHIVED";
  created_at: string;
  updated_at: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<PetService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // States Modal Thêm/Sửa
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // States Modal Xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // States Form
  const [comboName, setComboName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceStatus, setServiceStatus] = useState<"ACTIVE" | "ARCHIVED">(
    "ACTIVE",
  );
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // States Ghi chú quản lý
  const [managementNote, setManagementNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // 1. FETCH DỮ LIỆU
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const catRes = await api.get("/categories?type=SERVICE");
      const cats = catRes.data || catRes;
      const validCats = Array.isArray(cats) ? cats : [];
      setCategories(validCats);

      if (validCats.length > 0) {
        const serviceRequests = validCats.map((cat: any) =>
          api.get(`/services/${cat.category_id}`),
        );
        const serviceResponses = await Promise.all(serviceRequests);
        const allServices = serviceResponses.flatMap((res) => res.data || res);
        setServices(allServices);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu dịch vụ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load ghi chú từ localStorage khi component được mount
  useEffect(() => {
    const savedNote = localStorage.getItem("petcare_service_note");
    if (savedNote) {
      setManagementNote(savedNote);
    }
  }, []);

  // Reset trang khi lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // 2. LOGIC LỌC
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchSearch = service.combo_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchCat =
        categoryFilter === "all" ||
        service.category_id === Number(categoryFilter);
      const matchStatus =
        statusFilter === "all" || service.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [services, searchTerm, categoryFilter, statusFilter]);

  // 3. LOGIC DỊCH VỤ VỪA CẬP NHẬT (Lưu trữ 2 ngày = 48h)
  const recentlyUpdated = useMemo(() => {
    const now = Date.now();
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    return services
      .filter((s) => {
        if (!s.updated_at) return false;
        const diff = now - new Date(s.updated_at).getTime();
        return diff <= TWO_DAYS_MS;
      })
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 5);
  }, [services]);

  const getTimeAgo = (dateString: string) => {
    const diffHrs = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60),
    );
    if (diffHrs < 1) return "Vừa xong";
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    if (diffHrs < 48) return "Hôm qua";
    return `${Math.floor(diffHrs / 24)} ngày trước`;
  };

  // 4. PHÂN TRANG
  const totalItems = filteredServices.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentItems = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // 5. HÀM TIỆN ÍCH
  const getCategoryName = (id: number) => {
    return categories.find((c) => c.category_id === id)?.name || "Khác";
  };

  const renderDynamicIcon = (categoryId: number, comboName: string) => {
    const nameStr = comboName.toLowerCase();
    if (nameStr.includes("tắm") || nameStr.includes("sấy"))
      return <WashingMachine className="h-5 w-5" />;
    if (nameStr.includes("cắt") || nameStr.includes("tỉa"))
      return <Scissors className="h-5 w-5" />;
    if (
      nameStr.includes("tiêm") ||
      nameStr.includes("khám") ||
      nameStr.includes("y tế")
    )
      return <Syringe className="h-5 w-5" />;
    if (
      nameStr.includes("trông") ||
      nameStr.includes("lưu trú") ||
      nameStr.includes("ngày")
    )
      return <Home className="h-5 w-5" />;

    return categoryId % 2 === 0 ? (
      <WashingMachine className="h-5 w-5" />
    ) : (
      <Scissors className="h-5 w-5" />
    );
  };

  const handleSaveNote = () => {
    setIsSavingNote(true);
    // Lưu vào trình duyệt
    localStorage.setItem("petcare_service_note", managementNote);

    // Tạo hiệu ứng delay nhỏ để UX trông mượt mà và báo hiệu đã lưu
    setTimeout(() => {
      setIsSavingNote(false);
    }, 500);
  };

  // 6. CÁC HÀM XỬ LÝ MODAL FORM
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "other") {
      setIsOtherCategory(true);
      setCategoryId("");
    } else {
      setIsOtherCategory(false);
      setCategoryId(val);
      setNewCategoryName("");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setComboName("");
    setPrice("");
    setCategoryId("");
    setIsOtherCategory(false);
    setNewCategoryName("");
    setServiceStatus("ACTIVE");
    setIsFormModalOpen(true);
  };

  const openEditModal = (service: PetService) => {
    setEditingId(service.id);
    setComboName(service.combo_name);
    setPrice(Number(service.price).toString());
    setCategoryId(service.category_id.toString());
    setIsOtherCategory(false);
    setServiceStatus(service.status);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName || !price || (!categoryId && !isOtherCategory)) {
      alert("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    if (isOtherCategory && !newCategoryName.trim()) {
      alert("Vui lòng nhập tên danh mục mới!");
      return;
    }

    setIsUpdating(true);
    try {
      let finalCategoryId = Number(categoryId);

      if (isOtherCategory) {
        const catRes = await api.post("/categories", {
          name: newCategoryName.trim(),
          type: "SERVICE",
        });
        const catData = catRes.data || catRes;
        finalCategoryId = catData.category_id || catData.id;
      }

      const payload = {
        combo_name: comboName,
        price: Number(price),
        category_id: finalCategoryId,
        status: serviceStatus,
      };

      if (editingId) {
        await api.patch(`/services/${editingId}`, payload);
        alert("Cập nhật dịch vụ thành công!");
      } else {
        await api.post("/services", payload);
        alert("Thêm dịch vụ thành công!");
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert("Lỗi: " + (error.response?.data?.message || "Không xác định"));
    } finally {
      setIsUpdating(false);
    }
  };

  // 7. CÁC HÀM XỬ LÝ MODAL XÓA
  const confirmDelete = (service: PetService) => {
    setServiceToDelete({ id: service.id, name: service.combo_name });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!serviceToDelete) return;
    setIsUpdating(true);
    try {
      await api.delete(`/services/${serviceToDelete.id}`);
      alert("Đã xóa dịch vụ thành công!");
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(
        "Lỗi khi xóa dịch vụ: " +
          (error.response?.data?.message || "Không xác định"),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#fcfaf8] text-[#1b110d] min-h-screen flex flex-col font-['Inter']">
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-[1.25rem] font-extrabold tracking-tight text-[#1b110d] mb-1">
              Quản lý Dịch vụ
            </h1>
            <p className="text-sm text-[#9a624c]">
              Hệ thống ghi nhận{" "}
              <span className="font-bold text-[#1b110d]">
                {services.length} dịch vụ
              </span>{" "}
              đang vận hành
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-white border border-[#f3ebe7] rounded-full px-4 py-2.5 w-80 focus-within:ring-2 focus-within:ring-[#f7b297]/50 shadow-sm transition-all">
              <Search className="text-[#9a624c] h-4 w-4 mr-2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none placeholder:text-[#9a624c]/60 text-[#1b110d]"
                placeholder="Tìm kiếm dịch vụ..."
              />
            </div>
            <button
              onClick={openAddModal}
              className="bg-[#f7b297] hover:bg-[#fcb69b] text-[#ffffff] px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-[#f7b297]/30 active:scale-95 transition-all"
            >
              <Plus className="h-5 w-5" /> Thêm dịch vụ mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-[0_10px_15px_-3px_rgba(247,178,151,0.1)] border border-[#f3ebe7] flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-wider font-bold text-[#9a624c] px-1">
              Lọc theo danh mục
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#fcfaf8] border-none rounded-lg text-sm focus:ring-2 focus:ring-[#f7b297]/50 w-full font-medium text-[#1b110d] p-2 outline-none"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_10px_15px_-3px_rgba(247,178,151,0.1)] border border-[#f3ebe7] flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-wider font-bold text-[#9a624c] px-1">
              Lọc theo trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#fcfaf8] border-none rounded-lg text-sm focus:ring-2 focus:ring-[#f7b297]/50 w-full font-medium text-[#1b110d] p-2 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang phục vụ</option>
              <option value="ARCHIVED">Ngừng nhận</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#f3ebe7] mb-10">
          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-[#f7b297]">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p className="font-medium text-sm text-[#9a624c]">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f3ebe7] bg-[#fcfaf8]">
                    <th className="px-6 py-5 text-[11px] uppercase tracking-widest font-bold text-[#9a624c]">
                      Tên dịch vụ
                    </th>
                    <th className="px-6 py-5 text-[11px] uppercase tracking-widest font-bold text-[#9a624c]">
                      Danh mục
                    </th>
                    <th className="px-6 py-5 text-[11px] uppercase tracking-widest font-bold text-[#9a624c] text-center">
                      Thời gian
                    </th>
                    <th className="px-6 py-5 text-[11px] uppercase tracking-widest font-bold text-[#9a624c] text-right">
                      Giá bán
                    </th>
                    <th className="px-6 py-5 text-[11px] uppercase tracking-widest font-bold text-[#9a624c]">
                      Trạng thái
                    </th>
                    <th className="px-6 py-5 text-[11px] uppercase tracking-widest font-bold text-[#9a624c] text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3ebe7]">
                  {currentItems.length > 0 ? (
                    currentItems.map((srv) => (
                      <tr
                        key={srv.id}
                        className="hover:bg-[#fcfaf8] transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${srv.category_id % 2 === 0 ? "bg-[#e0f2f1] text-[#175856]" : "bg-[#f7b297]/20 text-[#f7b297]"}`}
                            >
                              {renderDynamicIcon(
                                srv.category_id,
                                srv.combo_name,
                              )}
                            </div>
                            <span className="font-bold text-[#1b110d]">
                              {srv.combo_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${srv.category_id % 2 === 0 ? "bg-[#e0f2f1] text-[#175856]" : "bg-[#f3ebe7] text-[#1b110d]"}`}
                          >
                            {getCategoryName(srv.category_id)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm font-medium text-[#9a624c]">
                            {srv.duration_minutes
                              ? `${srv.duration_minutes} phút`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-extrabold text-[#1b110d]">
                            {Number(srv.price).toLocaleString("vi-VN")}đ
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${srv.status === "ACTIVE" ? "bg-green-500" : "bg-[#d7c2bb]"}`}
                            ></span>
                            <span
                              className={`text-xs font-bold ${srv.status === "ACTIVE" ? "text-green-700" : "text-[#9a624c]"}`}
                            >
                              {srv.status === "ACTIVE"
                                ? "Đang phục vụ"
                                : "Ngừng nhận"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(srv)}
                              className="p-2 rounded-lg hover:bg-[#f3ebe7] transition-colors text-[#9a624c]"
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => confirmDelete(srv)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors text-[#ba1a1a]"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-[#9a624c]"
                      >
                        Không tìm thấy dịch vụ nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && !isLoading && (
            <div className="bg-[#fcfaf8] px-6 py-4 flex items-center justify-between border-t border-[#f3ebe7]">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9a624c]">
                Trang {currentPage} / {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#f3ebe7] text-[#1b110d] hover:bg-[#f7b297]/10 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#f3ebe7] text-[#1b110d] hover:bg-[#f7b297]/10 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-[0_10px_15px_-3px_rgba(247,178,151,0.1)] border border-[#f3ebe7]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-[#1b110d] flex items-center gap-2">
                <History className="text-[#f7b297] h-5 w-5" /> Dịch vụ vừa cập
                nhật
              </h3>
            </div>
            <div className="space-y-4">
              {recentlyUpdated.length > 0 ? (
                recentlyUpdated.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#fcfaf8] border border-[#f3ebe7]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#f7b297]/20 flex items-center justify-center text-[#f7b297]">
                        <WashingMachine className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1b110d]">
                          {srv.combo_name}
                        </p>
                        <p className="text-[10px] text-[#9a624c] italic">
                          {srv.status === "ACTIVE"
                            ? "Đang phục vụ"
                            : "Đã lưu trữ"}{" "}
                          • {getTimeAgo(srv.updated_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#f7b297]">
                      {Number(srv.price).toLocaleString()}đ
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#9a624c] italic">
                  Chưa có dịch vụ nào được cập nhật trong 48h qua.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#fff8f6] p-6 rounded-2xl shadow-[0_10px_15px_-3px_rgba(247,178,151,0.1)] border-2 border-dashed border-[#f7b297]/50 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="text-[#f7b297] h-5 w-5" />
              <h3 className="font-extrabold text-[#1b110d]">Ghi chú quản lý</h3>
            </div>
            <textarea
              value={managementNote}
              onChange={(e) => setManagementNote(e.target.value)}
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-[#9a624c] placeholder:text-[#9a624c]/40 resize-none leading-relaxed outline-none"
              placeholder="Nhập nhắc nhở vận hành nhanh tại đây..."
            ></textarea>
            <div className="mt-4 pt-4 border-t border-[#f7b297]/20 flex justify-between items-center">
              <span className="text-[10px] text-[#9a624c] font-medium transition-all">
                {isSavingNote ? "Đang lưu..." : "Đã đồng bộ cục bộ"}
              </span>
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="bg-[#f7b297]/20 text-[#f7b297] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-[#f7b297] hover:text-white transition-all disabled:opacity-50"
              >
                {isSavingNote ? "Đang xử lý" : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL FORM THÊM / SỬA --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-5 border-b border-[#f3ebe7] flex justify-between items-center bg-[#fcfaf8]">
              <h2 className="text-lg font-bold tracking-tight text-[#1b110d]">
                {editingId ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-[#9a624c] hover:text-[#1b110d] transition-colors p-1.5 hover:bg-[#f3ebe7] rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-8 space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9a624c] ml-1">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  className="w-full bg-[#fcfaf8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-[#f7b297]/50 text-[#1b110d] font-medium px-4 py-3 outline-none"
                  type="text"
                  placeholder="VD: Tắm & Sấy trọn gói"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9a624c] ml-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={isOtherCategory ? "other" : categoryId}
                    onChange={handleCategoryChange}
                    className="w-full appearance-none bg-[#fcfaf8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-[#f7b297]/50 text-[#1b110d] font-medium px-4 py-3 pr-10 outline-none"
                  >
                    <option value="" disabled>
                      Chọn danh mục
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="other" className="font-bold text-[#f7b297]">
                      + Khác (Thêm mới...)
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a624c] h-4 w-4 pointer-events-none" />
                </div>
                {isOtherCategory && (
                  <input
                    autoFocus
                    placeholder="Nhập tên danh mục dịch vụ mới..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="mt-2 w-full bg-white border border-[#f7b297] rounded-xl focus:ring-2 focus:ring-[#f7b297]/50 text-[#1b110d] font-medium px-4 py-2.5 outline-none animate-in fade-in slide-in-from-top-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#9a624c] ml-1">
                    Giá dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      min="1000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#fcfaf8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-[#f7b297]/50 text-[#1b110d] font-bold px-4 py-3 pr-8 outline-none"
                      type="number"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a624c] font-bold text-xs">
                      ₫
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#9a624c] ml-1">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <select
                      value={serviceStatus}
                      onChange={(e) => setServiceStatus(e.target.value as any)}
                      className="w-full appearance-none bg-[#fcfaf8] border border-[#f3ebe7] rounded-xl focus:ring-2 focus:ring-[#f7b297]/50 text-[#1b110d] font-medium px-4 py-3 pr-10 outline-none"
                    >
                      <option value="ACTIVE">Đang phục vụ</option>
                      <option value="ARCHIVED">Ngừng nhận</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a624c] h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#f3ebe7]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-[#1b110d] font-bold hover:bg-[#f3ebe7] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-8 py-2.5 rounded-full bg-[#f7b297] text-white font-bold shadow-lg shadow-[#f7b297]/30 hover:bg-[#fcb69b] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Lưu dịch vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL XÓA DỊCH VỤ --- */}
      {isDeleteModalOpen && serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-[#ba1a1a]">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1b110d]">
                  Xóa dịch vụ
                </h3>
                <p className="text-sm text-[#9a624c] mt-2">
                  Bạn có chắc chắn muốn xóa dịch vụ{" "}
                  <span className="font-bold text-[#1b110d]">
                    {serviceToDelete.name}
                  </span>{" "}
                  không? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2.5 rounded-full text-[#1b110d] font-bold bg-[#fcfaf8] border border-[#f3ebe7] hover:bg-[#f3ebe7] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeDelete}
                disabled={isUpdating}
                className="flex-1 px-4 py-2.5 rounded-full text-white font-bold bg-[#ba1a1a] hover:bg-[#93000a] shadow-lg shadow-[#ba1a1a]/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
