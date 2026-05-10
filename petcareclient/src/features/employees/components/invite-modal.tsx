import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Mail, Plus, Send, Trash2 } from "lucide-react";
import { useRef, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

import {
  getUsers,
  type User,
  inviteStaff,
  getStoreRoles,
  createStoreRole,
} from "../api/store.api";

type InviteModalProps = {
  isOpen: boolean;
  storeId: number;
  onClose: () => void;
};

type InviteItem = {
  email: string;
  name?: string;
};

const STAFF_ROLE_PAYLOAD = {
  name: "STAFF",
  description: "Nhân viên cửa hàng thú cưng",
  permission_ids: [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 21, 24, 29, 30, 31, 32, 33, 34, 45,
    48, 22, 17, 25,
  ],
};

export const InviteModal = ({ isOpen, onClose, storeId }: InviteModalProps) => {
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState("");
  const [inviteList, setInviteList] = useState<InviteItem[]>([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all users for autocomplete
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isOpen,
  });

  // Filter users based on input
  const suggestedUsers = useMemo(() => {
    if (!emailInput || !users) return [];
    const lowerInput = emailInput.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(lowerInput) ||
        u.full_name.toLowerCase().includes(lowerInput),
    );
  }, [emailInput, users]);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddEmail = (user?: User) => {
    setErrorMsg("");
    const targetEmail = user?.email || emailInput.trim();

    if (!targetEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setErrorMsg("Email không hợp lệ.");
      return;
    }

    if (
      inviteList.some(
        (item) => item.email.toLowerCase() === targetEmail.toLowerCase(),
      )
    ) {
      setErrorMsg("Email này đã có trong danh sách chờ gửi.");
      return;
    }

    const name = user ? user.full_name : "Người dùng mới";

    setInviteList((prev) => [...prev, { email: targetEmail, name }]);
    setEmailInput("");
    setShowSuggestions(false);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInviteList((prev) =>
      prev.filter((item) => item.email !== emailToRemove),
    );
  };

  const { mutate: sendInvites, isPending } = useMutation({
    mutationFn: async () => {
      if (inviteList.length === 0)
        throw new Error("Vui lòng thêm ít nhất một email.");

      // 1. Fetch Roles
      const roles = await getStoreRoles(storeId);
      let staffRole = roles.find((r) => r.name === "STAFF");

      // 2. Create STAFF role if not exists
      if (!staffRole) {
        staffRole = await createStoreRole(storeId, STAFF_ROLE_PAYLOAD);
      }

      // 3. Send all invites
      const promises = inviteList.map((item) =>
        inviteStaff(storeId, {
          email: item.email,
          role_id: staffRole!.id,
          message: message.trim() || undefined,
        }).catch((err) => {
          // Attach email to error so we know which one failed
          throw new Error(
            `Lỗi khi gửi đến ${item.email}: ${err.response?.data?.message || err.message}`,
          );
        }),
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", storeId] });
      toast.success("Đã gửi lời mời thành công!");
      handleClose();
    },
    onError: (error: any) => {
      setErrorMsg(error.message || "Đã xảy ra lỗi khi gửi lời mời.");
    },
  });

  const handleClose = () => {
    setEmailInput("");
    setInviteList([]);
    setMessage("");
    setErrorMsg("");
    setShowSuggestions(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#2f231d]">
              Mời nhân viên tham gia
            </h2>
            <p className="mt-1 text-sm text-[#9f7d67]">
              Gửi lời mời tham gia hệ thống cho nhân viên mới
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9f7d67] hover:bg-[#f8f1ec] hover:text-[#2f231d] transition cursor-pointer"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Section 1: Email Input */}
          <div className="space-y-3 relative" ref={dropdownRef}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff4eb] text-xs font-bold text-[#f27a4d]">
                1
              </span>
              <label className="text-sm font-bold text-[#2f231d]">
                Thêm nhân viên vào danh sách
              </label>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7d67]">
              Email người nhận
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f27a4d]">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                  placeholder="staff@pethaven.com"
                  className="w-full rounded-full border border-[#ecdcd1] bg-[#fdfaf8] py-3 pl-12 pr-4 text-sm font-medium text-[#523c30] outline-none transition focus:border-[#f27a4d] focus:ring-2 focus:ring-[#fff4eb]"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestedUsers.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 max-h-48 overflow-y-auto rounded-2xl border border-[#ecdcd1] bg-white p-2 shadow-xl">
                    {suggestedUsers.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleAddEmail(user)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left hover:bg-[#fcfafa] transition"
                        type="button"
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.full_name}`}
                          alt=""
                          className="h-8 w-8 rounded-full bg-[#fdfaf8]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-[#2f231d]">
                            {user.full_name}
                          </div>
                          <div className="truncate text-xs text-[#9f7d67]">
                            {user.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAddEmail()}
                type="button"
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f27a4d] text-white shadow-sm transition hover:bg-[#e1683b]"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Section 2: Invite List */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7d67]">
              Danh sách lời mời ({inviteList.length})
            </p>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
              {inviteList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#ecdcd1] p-6 text-center text-sm text-[#9f7d67]">
                  Chưa có email nào trong danh sách.
                </div>
              ) : (
                inviteList.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-[#ecdcd1] bg-[#fcfafa] p-3 transition hover:border-[#dcae8c]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3ebe7] text-[#9f7d67]">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.name}`}
                          alt=""
                          className="h-full w-full rounded-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#2f231d]">
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-[#9f7d67]">
                          {item.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEmail(item.email)}
                      type="button"
                      className="ml-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#9f7d67] transition hover:bg-[#f3ebe7] hover:text-[#d33d3d]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Message */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7d67]">
              Lời nhắn chung (tùy chọn)
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Chào mừng bạn đến với PetCare!"
              className="w-full resize-none rounded-2xl border border-[#ecdcd1] bg-[#fdfaf8] p-4 text-sm font-medium text-[#523c30] outline-none transition focus:border-[#f27a4d] focus:ring-2 focus:ring-[#fff4eb]"
              rows={3}
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full px-6 py-3 text-sm font-bold text-[#8d6955] transition hover:bg-[#f8f1ec] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => sendInvites()}
              disabled={isPending || inviteList.length === 0}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f27a4d] px-8 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(242,122,77,0.25)] transition hover:bg-[#e1683b] hover:shadow-[0_6px_20px_rgba(242,122,77,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                "Đang gửi..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi tất cả lời mời
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
