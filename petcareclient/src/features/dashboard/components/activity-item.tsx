import { type ActivityItem } from "../api/dashboard-api";

interface ActivityItemComponentProps {
  activity: ActivityItem;
}

const getActivityIcon = (type: ActivityItem["type"]) => {
  const iconMap = {
    service: {
      icon: "shower",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
    purchase: {
      icon: "shopping_bag",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    vaccine: {
      icon: "vaccines",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    cancel: {
      icon: "event_busy",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      textColor: "text-gray-500",
    },
    grooming: {
      icon: "content_cut",
      bgColor: "bg-mint",
      textColor: "text-teal-800",
    },
  };
  return iconMap[type];
};

const getStatusColor = (status: ActivityItem["status"]) => {
  const colorMap = {
    completed: "bg-green-500",
    cancelled: "bg-red-400",
    pending: "bg-yellow-500",
  };

  return colorMap[status];
};

export const ActivityItemComponent = ({
  activity,
}: ActivityItemComponentProps) => {
  const { icon, bgColor, textColor } = getActivityIcon(activity.type);
  const statusColor = getStatusColor(activity.status);

  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-10 w-10 shrink-0 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-charcoal dark:text-gray-200">
          {activity.petName}
        </p>
        <p className="truncate text-xs text-gray-500">{activity.action}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-charcoal dark:text-gray-300">
          {activity.time}
        </p>
        <span
          className={`inline-block h-2 w-2 rounded-full ${statusColor}`}
        ></span>
      </div>
    </div>
  );
};
