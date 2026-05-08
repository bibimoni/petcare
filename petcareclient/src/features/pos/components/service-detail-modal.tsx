import { Sparkles } from "lucide-react";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

type ServiceDetailModalData = {
  name: string;
  price: number;
  minWeight: number;
  maxWeight: number;
  description: string;
  categoryName: string;
};

type ServiceDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceDetailModalData | null;
};

const formatCurrencyVnd = (value: number) => {
  return value.toLocaleString("vi-VN");
};

export const ServiceDetailModal = ({
  open,
  onOpenChange,
  service,
}: ServiceDetailModalProps) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[92vw] max-w-[720px] overflow-hidden rounded-[32px] border-none bg-[#f8f6f5] p-0 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="px-8 pb-7 pt-7">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-3xl font-extrabold leading-tight text-[#1f1713]">
              Thông tin dịch vụ
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#9d6f56]">
              Chi tiết cấu hình dịch vụ trong hệ thống
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[26px] border border-[#efe1d9] bg-[#f5f2f1] px-6 py-5">
              <div className="flex h-full flex-col justify-between gap-3">
                <p className="text-md font-bold uppercase tracking-[0.22em] text-[#d08b65]">
                  Tên dịch vụ
                </p>
                <h3 className="text-2xl font-black leading-[1.03] tracking-tight text-[#201613]">
                  {service?.name ?? "-"}
                </h3>
              </div>
            </div>

            <div className="rounded-[26px] bg-[#eee7e3] px-6 py-5">
              <div className="flex h-full flex-col justify-between gap-3">
                <p className="text-md font-bold uppercase tracking-[0.22em] text-[#9f725b]">
                  Danh mục
                </p>
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f6b494] px-4 py-2 text-sm font-bold text-[#6b3d24]">
                  <Sparkles className="w-5 h-5" />
                  <span>{service?.categoryName ?? "Khác"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-6 border-t border-[#e6d8d0] pt-6 md:grid-cols-2">
            <div>
              <p className="text-md font-bold uppercase tracking-[0.2em] text-[#9f725b]">
                Yêu cầu cân nặng
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#e5dcd8] px-4 py-3">
                  <p className="text-xs text-[#9d7b69]">Tối thiểu</p>
                  <p className="mt-1 text-[26px] font-extrabold leading-none text-[#211712]">
                    {service?.minWeight ?? 0}
                    <span className="ml-1 text-sm font-bold text-[#9d7b69]">
                      KG
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl bg-[#e5dcd8] px-4 py-3">
                  <p className="text-xs text-[#9d7b69]">Tối đa</p>
                  <p className="mt-1 text-[26px] font-extrabold leading-none text-[#211712]">
                    {service?.maxWeight ?? 0}
                    <span className="ml-1 text-sm font-bold text-[#9d7b69]">
                      KG
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-md font-bold uppercase tracking-[0.2em] text-[#9f725b]">
                Giá niêm yết
              </p>
              <div className="mt-3 rounded-[24px] bg-[#f4efec] px-6 py-4">
                <p className="text-3xl font-black leading-none text-[#1f1713]">
                  {formatCurrencyVnd(service?.price ?? 0)}
                  <span className="ml-2 text-sm font-bold text-[#d08b65]">
                    VND
                  </span>
                </p>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-[#9f7d67]">
                {service?.description ?? "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#e9ddd6] px-8 py-5">
          <button
            className="rounded-xl cursor-pointer px-5 py-2 text-base font-bold text-[#a95f3b] transition hover:bg-[#f3e9e3]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
