import { X, User, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { type HistoryEntry, getOrderHistory, getProductHistory, getServiceHistory, getRoleHistory } from "../api/audit-logs.api";

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceId: number;
  referenceType: string;
  storeId: number;
}

export const AuditLogDetailModal = ({
  isOpen,
  onClose,
  referenceId,
  referenceType,
  storeId,
}: AuditLogDetailModalProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !referenceId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        let data: HistoryEntry[] = [];
        switch (referenceType) {
          case "ORDER":
            data = await getOrderHistory(referenceId);
            break;
          case "PRODUCT":
            data = await getProductHistory(referenceId);
            break;
          case "SERVICE":
            data = await getServiceHistory(referenceId);
            break;
          case "ROLE":
            data = await getRoleHistory(storeId, referenceId);
            break;
        }
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, referenceId, referenceType, storeId]);

  if (!isOpen) return null;

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-gray-400 italic">null</span>;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-[#f3ebe7] flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-[#f3ebe7] flex justify-between items-center bg-[#fcf9f8]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1b110d]">
              Chi tiết thay đổi
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {referenceType} #{referenceId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-[#1b110d] transition-colors p-2 hover:bg-[#f3ebe7] rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Đang tải lịch sử thay đổi...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Không tìm thấy lịch sử thay đổi chi tiết cho mục này.
            </div>
          ) : (
            <div className="space-y-12">
              {history.map((entry) => (
                <div key={entry.id} className="relative pl-8 border-l-2 border-orange-100 pb-4 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div>

                  <div className="flex flex-wrap items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-charcoal">
                      <User size={16} className="text-orange-500" />
                      {entry.performed_by_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={16} />
                      {new Date(entry.created_at).toLocaleString("vi-VN")}
                    </div>
                    <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {entry.action}
                    </div>
                  </div>

                  <div className="bg-[#fcfafa] rounded-xl border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-2 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <div className="px-6 py-2 border-r border-gray-100">Giá trị cũ</div>
                      <div className="px-6 py-2">Giá trị mới</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {entry.old_values && entry.new_values ? (
                        Object.keys({ ...entry.old_values, ...entry.new_values }).map((key) => {
                          const oldVal = entry.old_values?.[key];
                          const newVal = entry.new_values?.[key];
                          const isChanged = oldVal !== newVal;

                          return (
                            <div key={key} className={`grid grid-cols-2 text-sm ${isChanged ? "bg-orange-50/30" : ""}`}>
                              <div className="px-6 py-3 border-r border-gray-100 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{key}</span>
                                <div className="text-gray-600 break-all">{renderValue(oldVal)}</div>
                              </div>
                              <div className="px-6 py-3 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{key}</span>
                                <div className={`font-bold break-all ${isChanged ? "text-orange-600" : "text-charcoal"}`}>
                                  {renderValue(newVal)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : entry.action === "CREATED" ? (
                        <div className="p-6">
                          <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Thông tin khởi tạo</div>
                          <pre className="text-xs bg-white p-4 rounded-lg border border-gray-100 overflow-x-auto">
                            {JSON.stringify(entry.new_values, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="p-6 text-gray-400 italic text-sm">
                          Không có dữ liệu thay đổi cụ thể.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-4 border-t border-[#f3ebe7] bg-[#fcf9f8] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white border border-[#f3ebe7] text-charcoal font-bold hover:bg-[#f3ebe7] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
