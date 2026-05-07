import { Eye, Info } from "lucide-react";

interface ActivityItem {
  type: string;
  title: string;
  created_at: string;
  description: string;
  reference_id: number;
  reference_type: string;
}

interface AuditLogTableProps {
  activities: ActivityItem[];
  onViewDetail: (activity: ActivityItem) => void;
  isLoading: boolean;
}

export const AuditLogTable = ({
  activities,
  onViewDetail,
  isLoading,
}: AuditLogTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] p-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Đang tải nhật ký hệ thống...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] p-20 flex flex-col items-center justify-center text-center">
        <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Info size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-charcoal">Không tìm thấy nhật ký</h3>
        <p className="text-gray-500">Hiện tại chưa có hoạt động nào được ghi lại.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    if (type.includes("CANCEL")) return "cancel";
    if (type.includes("UPDATE")) return "edit";
    if (type.includes("CREATE")) return "add_circle";
    return "info";
  };

  const getStatusColor = (type: string) => {
    if (type.includes("CANCEL")) return "bg-red-100 text-red-600 border-red-200";
    if (type.includes("UPDATE")) return "bg-blue-100 text-blue-600 border-blue-200";
    if (type.includes("CREATE")) return "bg-green-100 text-green-600 border-green-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#f3ebe7] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#fcf9f8] border-b border-[#f3ebe7]">
            <tr className="text-[10px] font-bold uppercase tracking-widest text-[#a07f6b]">
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Hoạt động</th>
              <th className="px-6 py-4">Đối tượng</th>
              <th className="px-6 py-4">Mô tả</th>
              <th className="px-6 py-4 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3ebe7]">
            {activities.map((activity, index) => (
              <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-charcoal">
                      {new Date(activity.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(activity.type)}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {getIcon(activity.type)}
                    </span>
                    {activity.type}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                      {activity.reference_type}
                    </span>
                    <span className="text-sm font-bold text-charcoal">
                      #{activity.reference_id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-charcoal line-clamp-1">{activity.title}</span>
                    <span className="text-xs text-gray-500 line-clamp-1">{activity.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetail(activity)}
                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
                    title="Xem chi tiết thay đổi"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
