import { X, User, Phone, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { CustomerApi } from "@/features/customer/api/customer-api";
import { handleApiError } from "@/lib/api";

type AddCustomerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
};

export default function AddCustomerModal({
  open,
  onOpenChange,
  onCreated,
}: AddCustomerModalProps) {
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setErrors({
      fullName: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      fullName: fullName.trim() ? "" : "Vui lòng nhập tên khách hàng",
      email: email.trim() ? "" : "Vui lòng nhập email khách hàng",
      phone: phone.trim() ? "" : "Vui lòng nhập số điện thoại",
      address: address.trim() ? "" : "Vui lòng nhập địa chỉ",
    };

    setErrors(nextErrors);

    if (
      nextErrors.fullName ||
      nextErrors.email ||
      nextErrors.phone ||
      nextErrors.address
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      await CustomerApi.createCustomer({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });

      await onCreated();
      toast.success("Thêm khách hàng mới thành công");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden rounded-[28px] border-none bg-[#f5f3f3] p-0 shadow-2xl sm:max-w-[640px] [&>button]:hidden">
        <DialogHeader className="space-y-2 px-8 pt-8 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl leading-tight font-extrabold text-[#1f1816]">
                Thêm khách hàng mới
              </DialogTitle>
              <DialogDescription className="mt-2 text-md leading-snug text-[#9f7461]">
                Nhập thông tin khách hàng
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full p-2 text-[#a56f5a] transition hover:bg-[#ece7e5]"
                aria-label="Dong"
              >
                <X className="h-8 w-8" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="space-y-7 overflow-y-auto px-8 pb-4 pt-4">
            <label className="block">
              <span className="mb-2 block text-md font-semibold text-[#2f2420]">
                Tên khách hàng <span className="text-[#dc6e5f]">*</span>
              </span>
              <div className="flex h-16 items-center gap-3 rounded-3xl bg-[#efeded] px-5">
                <User className="h-6 w-6 text-[#a3745f]" />
                <input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: "" }));
                    }
                  }}
                  placeholder="Nguyễn Văn A"
                  className="h-full w-full bg-transparent text-md text-[#2f2420] placeholder:text-[#c7b7b2] focus:outline-none"
                />
              </div>
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-500">{errors.fullName}</p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-md font-semibold text-[#2f2420]">
                Email khách hàng <span className="text-[#dc6e5f]">*</span>
              </span>
              <div className="flex h-16 items-center gap-3 rounded-3xl bg-[#efeded] px-5">
                <User className="h-6 w-6 text-[#a3745f]" />
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  placeholder="example@gmail.com"
                  className="h-full w-full bg-transparent text-md text-[#2f2420] placeholder:text-[#c7b7b2] focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-500">{errors.email}</p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-md font-semibold text-[#2f2420]">
                Số điện thoại <span className="text-[#dc6e5f]">*</span>
              </span>
              <div className="flex h-16 items-center gap-3 rounded-3xl bg-[#efeded] px-5">
                <Phone className="h-6 w-6 text-[#a3745f]" />
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) {
                      setErrors((prev) => ({ ...prev, phone: "" }));
                    }
                  }}
                  placeholder="0912 345 678"
                  className="h-full w-full bg-transparent text-md text-[#2f2420] placeholder:text-[#c7b7b2] focus:outline-none"
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-500">{errors.phone}</p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-md font-semibold text-[#2f2420]">
                Địa chỉ
              </span>
              <div className="flex min-h-28 items-start gap-3 rounded-3xl bg-[#efeded] px-5 py-4">
                <MapPin className="mt-1 h-6 w-6 text-[#a3745f]" />
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) {
                      setErrors((prev) => ({ ...prev, address: "" }));
                    }
                  }}
                  placeholder="Nhập địa chỉ của khách hàng..."
                  className="h-20 w-full resize-none bg-transparent text-md text-[#2f2420] placeholder:text-[#c7b7b2] focus:outline-none"
                />
              </div>
              {errors.address && (
                <p className="mt-2 text-sm text-red-500">{errors.address}</p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-md font-semibold text-[#2f2420]">
                Ghi chú
              </span>
              <div className="flex min-h-24 items-start gap-3 rounded-3xl bg-[#efeded] px-5 py-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: VIP customer"
                  className="h-16 w-full resize-none bg-transparent text-md text-[#2f2420] placeholder:text-[#c7b7b2] focus:outline-none"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 flex shrink-0 flex-col gap-4 px-8 pb-8 pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-14 cursor-pointer rounded-full border-[#e4d9d4] bg-transparent px-10 text-md font-bold text-[#9f6d57] hover:bg-[#efe8e4]"
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              className="h-14 cursor-pointer rounded-full bg-[#e9a88d] px-10 text-md font-bold text-white hover:bg-[#de9a7e]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thông tin"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
