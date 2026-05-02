import { type ActivityFeedData } from "../api/dashboard-api";
import { ActivityItemComponent } from "./activity-item";

interface ActivityFeedProps {
  data: ActivityFeedData;
}

export const ActivityFeed = ({ data }: ActivityFeedProps) => {
  return (
    <div className="rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-gray-50/50 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-charcoal dark:text-white">
          Hoạt động mới
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {data.activities.map((activity, index) => (
          <ActivityItemComponent key={index} activity={activity} />
        ))}
      </div>
    </div>
  );
};
