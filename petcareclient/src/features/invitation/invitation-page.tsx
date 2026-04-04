import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { LogoIcon } from "@/components/LogoIcon";
import { Sidebar } from "@/components/Sidebar";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api";
import { sidebarUser } from "@/lib/user";

type NotificationItem = {
  type: string;
  title?: string;
  message: string;
  action_url: string;
  created_at: string;
  notification_id: string;
};

type StoreDetail = {
  id: number;
  city: string;
  name: string;
  phone: string;
  status: string;
  address: string;
  country: string;
  created_at: string;
  updated_at: string;
  state: string | null;
  logo_url: string | null;
  postal_code: string | null;
  notification_cron: string | null;
};

type NotificationDetail = {
  type: string;
  title: string;
  status: string;
  message: string;
  user_id: number;
  product: unknown;
  action_url: string;
  created_at: string;
  updated_at: string;
  notification_id: number;
  store_id: number | null;
  product_id: number | null;
  store: StoreDetail | null;
  product_name: string | null;
};

export default function InvitationPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] =
    useState<NotificationDetail | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/notifications/user", {
        params: { status: "UNREAD" },
      });
      setNotifications(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (notifications.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > notifications.length - 1) {
      setCurrentIndex(notifications.length - 1);
    }
  }, [notifications, currentIndex]);

  const currentNotification = notifications[currentIndex];

  const handlePrevious = () => {
    if (notifications.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === 0 ? notifications.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    if (notifications.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === notifications.length - 1 ? 0 : prev + 1,
    );
  };

  const handleOpenDetail = useCallback(async (notificationId: string) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const res = await axiosClient.get(`/notifications/${notificationId}`);
      setSelectedDetail(res.data ?? null);
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectedStore = selectedDetail?.store;

  const buildAcceptInvitationHref = (
    actionUrl: string,
    notificationId: string,
  ) => {
    try {
      const parsedUrl = new URL(actionUrl);
      const token = parsedUrl.searchParams.get("token");

      if (!token) return actionUrl;

      const params = new URLSearchParams({
        notificationId,
        token,
      });

      return `/accept-invitation?${params.toString()}`;
    } catch {
      return actionUrl;
    }
  };

  return (
    <Dialog
      open={detailModalOpen}
      onOpenChange={(open) => {
        setDetailModalOpen(open);
        if (!open) {
          setSelectedDetail(null);
          setDetailLoading(false);
        }
      }}
    >
      <div className="flex min-h-screen bg-[#fdf9f6]">
        <Sidebar userInfo={sidebarUser} />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b px-10 py-6 flex items-start justify-between shadow-sm">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-orange-600/80">
                Lời mời quản trị
              </h1>
              <p className="text-[#bfa08c] text-sm">
                Thông báo các yêu cầu tham gia quản lý
              </p>
            </div>
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Tải lại thông báo"
              title="Tải lại thông báo"
            >
              <RotateCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {loading ? (
              <div className="text-[#bfa08c] text-lg">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-[#bfa08c] text-lg">Không có lời mời mới</div>
            ) : (
              <div className="w-full max-w-xl px-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="h-10 w-10 shrink-0 rounded-full border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={notifications.length <= 1}
                    aria-label="Thông báo trước"
                  >
                    <ChevronLeft className="mx-auto h-5 w-5" />
                  </button>

                  <div
                    key={currentNotification.notification_id}
                    className="bg-white rounded-3xl shadow-xl p-10 w-full flex flex-col items-center cursor-pointer"
                    onClick={() =>
                      handleOpenDetail(currentNotification.notification_id)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenDetail(currentNotification.notification_id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-col items-center mb-6">
                      <LogoIcon />
                      <h2 className="text-xl font-bold text-[#a86a3d] text-center">
                        {currentNotification.title || "Lời mời quản trị"}
                      </h2>
                      <div className="text-xs text-[#bfa08c] font-medium mb-2 text-center">
                        {currentNotification.type === "STORE_INVITATION"
                          ? "CỬA HÀNG THÚ CƯNG"
                          : currentNotification.type}
                      </div>
                    </div>
                    <div className="bg-[#fdf6f0] rounded-xl p-4 w-full flex flex-col items-center mb-6">
                      <div className="text-xs text-[#bfa08c] mb-1">
                        NỘI DUNG
                      </div>
                      <div className="text-[#a86a3d] font-semibold text-center">
                        {currentNotification.message}
                      </div>
                      <div className="text-xs text-[#bfa08c] mt-2">
                        Gửi ngày{" "}
                        {new Date(
                          currentNotification.created_at,
                        ).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div className="flex gap-4 w-full">
                      <a
                        href={buildAcceptInvitationHref(
                          currentNotification.action_url,
                          currentNotification.notification_id,
                        )}
                        onClick={(event) => event.stopPropagation()}
                        className="flex-1 bg-orange-600/80 hover:bg-[#f5a96a] text-white font-bold py-3 rounded-xl transition text-center"
                      >
                        Chấp nhận
                      </a>
                    </div>
                    <div className="text-xs text-orange-600/80 mt-6 text-center">
                      THÔNG BÁO {currentIndex + 1}/{notifications.length}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="h-10 w-10 shrink-0 rounded-full border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={notifications.length <= 1}
                    aria-label="Thông báo tiếp theo"
                  >
                    <ChevronRight className="mx-auto h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <DialogContent className="sm:max-w-xl rounded-2xl border-none bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="text-lg font-bold text-[#a86a3d]">
            Chi tiết lời mời
          </DialogTitle>
          <DialogDescription className="text-[#bfa08c]">
            Thông tin cửa hàng từ thông báo đã chọn
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {detailLoading ? (
            <div className="text-sm text-[#bfa08c]">Đang tải chi tiết...</div>
          ) : !selectedDetail ? (
            <div className="text-sm text-[#bfa08c]">
              Không tải được chi tiết thông báo.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="text-xs text-[#bfa08c]">TIÊU ĐỀ</div>
                <div className="font-semibold text-[#a86a3d]">
                  {selectedDetail.title}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-[#bfa08c]">NỘI DUNG</div>
                <div className="text-[#7a5a43]">{selectedDetail.message}</div>
              </div>

              {selectedStore ? (
                <div className="rounded-xl border border-orange-100 bg-[#fdf9f6] p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    {selectedStore.logo_url ? (
                      <img
                        src={selectedStore.logo_url}
                        alt={selectedStore.name}
                        className="h-14 w-14 rounded-full border border-orange-100 object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full border border-orange-100 bg-white flex items-center justify-center text-xs text-[#bfa08c]">
                        No Logo
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-[#bfa08c]">CỬA HÀNG</div>
                      <div className="text-base font-bold text-[#a86a3d]">
                        {selectedStore.name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-[#7a5a43] sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-[#bfa08c]">TRẠNG THÁI</div>
                      <div>{selectedStore.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#bfa08c]">
                        SỐ ĐIỆN THOẠI
                      </div>
                      <div>{selectedStore.phone}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-[#bfa08c]">ĐỊA CHỈ</div>
                      <div>
                        {selectedStore.address}, {selectedStore.city},{" "}
                        {selectedStore.country}
                      </div>
                    </div>
                    {selectedStore.postal_code ? (
                      <div>
                        <div className="text-xs text-[#bfa08c]">
                          POSTAL CODE
                        </div>
                        <div>{selectedStore.postal_code}</div>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs text-[#bfa08c]">NGÀY TẠO</div>
                      <div>
                        {new Date(selectedStore.created_at).toLocaleDateString(
                          "vi-VN",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-orange-100 bg-[#fdf9f6] p-4 text-sm text-[#bfa08c]">
                  Thông báo này không có thông tin cửa hàng.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
