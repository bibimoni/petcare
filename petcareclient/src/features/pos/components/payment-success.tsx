import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import {
  confirmOrder,
  getOrderPayment,
  type OrderPaymentDto,
} from "@/features/pos/api";

const REDIRECT_SECONDS = 30;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const hasConfirmedRef = useRef(false);

  const [result, setResult] = useState<OrderPaymentDto | null>(null);

  const formatVND = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(intervalId);
          navigate("/pos", { replace: true });
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  useEffect(() => {
    if (!orderId) return;

    const fetchPayment = async () => {
      try {
        const payment = await getOrderPayment(Number(orderId));
        setResult(payment ?? null);
      } catch (_error) {
        // global error
      }
    };

    void fetchPayment();
  }, [orderId]);

  useEffect(() => {
    if (!orderId || hasConfirmedRef.current) return;

    hasConfirmedRef.current = true;

    const confirm = async () => {
      try {
        await confirmOrder(Number(orderId));
      } catch (_error) {
        // global error
      }
    };

    void confirm();
  }, [orderId]);

  const handleGoBackNow = () => {
    navigate("/pos", { replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden transition-all duration-300">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf7f5]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-[#f0e6df] bg-[#faf7f5]/90 px-6 backdrop-blur-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cb8f6a]">
              POS
            </p>
            <h1 className="text-base font-bold text-[#2f231d]">
              Thanh toán thành công
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <section className="overflow-hidden rounded-[2rem] border border-[#f0e3dc] bg-white shadow-[0_20px_60px_rgba(130,92,67,0.12)]">
              <div className="bg-gradient-to-br from-[#1f8c6e] via-[#3ab089] to-[#7ed8b8] px-8 py-10 text-white">
                <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[34px]">
                    check_circle
                  </span>
                </div>

                <h2 className="text-3xl font-black">Thanh toán thành công</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">
                  Hóa đơn đã được ghi nhận và đơn hàng sẵn sàng tiếp tục quy
                  trình xử lý. Màn hình sẽ tự động quay về POS sau {secondsLeft}{" "}
                  giây.
                </p>
              </div>

              <div className="grid gap-6 px-8 py-8 md:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a07f6b]">
                      Mã đơn hàng
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#2f231d]">
                      #{orderId ?? "N/A"}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#faf7f5] p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#a07f6b]">
                        Thời gian chờ
                      </p>
                      <p className="mt-2 text-3xl font-black text-[#f27a4d]">
                        {secondsLeft}s
                      </p>
                    </div>
                  </div>

                  {result?.stripe_receipt_url && (
                    <div>
                      <a
                        className="text-orange-600 underline"
                        href={result.stripe_receipt_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Xem hóa đơn
                      </a>
                    </div>
                  )}
                </div>

                <aside className="rounded-2xl bg-[#faf7f5] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a07f6b]">
                    Trạng thái
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                      <span className="text-sm text-[#7a5f50]">Mã đơn</span>
                      <span className="font-bold text-[#1f8c6e]">
                        {result?.order_id ?? orderId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                      <span className="text-sm text-[#7a5f50]">Số tiền</span>
                      <span className="font-bold text-[#1f8c6e]">
                        {formatVND(result?.amount)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoBackNow}
                    className="mt-6 flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-[#f27a4d] px-4 py-3 font-bold text-white transition hover:bg-[#e86c42]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                    Đi tới POS ngay
                  </button>
                </aside>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;
