import { type ActivityItem } from "../api/dashboard-api";

interface ActivityItemComponentProps {
  activity: ActivityItem;
}

const getActivityIcon = (type: string) => {
  if (type === "LOW_STOCK") {
    return {
      icon: "warning",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    };
  }
  if (type.startsWith("ORDER_")) {
    return {
      icon: "shopping_bag",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    };
  }
  if (type === "PET_ADDED") {
    return { icon: "pets", bgColor: "bg-mint", textColor: "text-teal-800" };
  }
  if (type === "CUSTOMER_ADDED") {
    return {
      icon: "person",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    };
  }

  return {
    icon: "notifications",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    textColor: "text-gray-500",
  };
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const ActivityItemComponent = ({
  activity,
}: ActivityItemComponentProps) => {
  const { icon, bgColor, textColor } = getActivityIcon(activity.type);

  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-10 w-10 shrink-0 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-charcoal dark:text-gray-200">
          {activity.title}
        </p>
        <p className="truncate text-xs text-gray-500">{activity.description}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-charcoal dark:text-gray-300">
          {formatTime(activity.created_at)}
        </p>
      </div>
    </div>
  );
};
