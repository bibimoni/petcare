import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api";

type AcceptInvitationResponse = {
  note: string;
  message: string;
  store: {
    id: number;
    name: string;
    status: string;
  };
  role: {
    id: number;
    name: string;
    description: string;
  };
  user: {
    email: string;
    status: string;
    user_id: number;
    full_name: string;
  };
};

export default function AcceptInvitationPage() {
  const [dialogOpen, setDialogOpen] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AcceptInvitationResponse | null>(null);
  const hasRequested = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAcceptSuccess = !loading && !errorMessage && !!result;
  const redirectPath = isAcceptSuccess ? "/dashboard" : "/invitations";

  useEffect(() => {
    const token = searchParams.get("token");
    const notificationId = searchParams.get("notificationId");

    if (!token) {
      setErrorMessage("Không tìm thấy token lời mời hợp lệ.");
      setLoading(false);
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    const acceptInvitation = async () => {
      try {
        const response = await axiosClient.get("/stores/invitations/accept", {
          params: { token },
        });

        setResult(response.data ?? null);

        if (notificationId) {
          await axiosClient.patch(`/notifications/${notificationId}/mark-read`);
        }
      } catch {
        setErrorMessage("Không thể chấp nhận lời mời. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    void acceptInvitation();
  }, [searchParams]);

  useEffect(() => {
    if (loading || !dialogOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectPath);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dialogOpen, loading, navigate, redirectPath]);

  const handleGoDashboardNow = () => {
    navigate(redirectPath);
  };

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar />
      <main className="flex-1">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-none bg-white p-0 shadow-2xl">
            <DialogHeader className="border-b px-6 py-5 text-left">
              <DialogTitle className="text-lg font-bold text-[#a86a3d]">
                {loading ? "Đang xử lý lời mời" : "Chấp nhận lời mời"}
              </DialogTitle>
              <DialogDescription className="text-[#bfa08c]">
                {loading
                  ? "Hệ thống đang xử lý yêu cầu tham gia cửa hàng."
                  : "Kết quả chấp nhận lời mời tham gia cửa hàng."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5 text-sm">
              {loading ? (
                <div className="text-[#bfa08c]">Vui lòng chờ...</div>
              ) : errorMessage ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-600">
                    {errorMessage}
                  </div>
                  <div className="text-[#bfa08c]">
                    Tự động quay về trang lời mời sau {countdown} giây.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
                    {result?.message || "Chấp nhận lời mời thành công"}
                  </div>
                  <div className="text-[#7a5a43]">
                    {result?.note ||
                      "Bạn đã được thêm vào cửa hàng thành công. Vui lòng đăng nhập để tiếp tục"}
                  </div>

                  <div className="rounded-xl border border-orange-100 bg-[#fdf9f6] p-4 space-y-2 text-[#7a5a43]">
                    <div>
                      <span className="font-semibold">Cửa hàng: </span>
                      {result?.store?.name} ({result?.store?.status})
                    </div>
                    <div>
                      <span className="font-semibold">Vai trò: </span>
                      {result?.role?.name}
                    </div>
                    <div>
                      <span className="font-semibold">Mô tả vai trò: </span>
                      {result?.role?.description}
                    </div>
                    <div>
                      <span className="font-semibold">Người dùng: </span>
                      {result?.user?.full_name} - {result?.user?.email}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[#bfa08c]">
                      Tự động quay về Dashboard sau {countdown} giây.
                    </div>
                    <button
                      type="button"
                      onClick={handleGoDashboardNow}
                      className="rounded-lg bg-orange-600/80 px-3 py-2 font-semibold text-white transition hover:bg-[#f5a96a]"
                    >
                      Về Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
