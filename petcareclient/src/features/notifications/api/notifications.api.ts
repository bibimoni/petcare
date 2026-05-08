import api from "@/lib/api";

export enum NotificationType {
  LOW_STOCK = "LOW_STOCK",
  EXPIRY_WARNING = "EXPIRY_WARNING",
  EXPIRED = "EXPIRED",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  STORE_INVITATION = "STORE_INVITATION",
}

export enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ",
  ARCHIVED = "ARCHIVED",
}

export interface NotificationItem {
  notification_id: number;
  store_id: number;
  product_id?: number | null;
  user_id?: number | null;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  product_name?: string | null;
  action_url?: string | null;
  created_at: string;
  updated_at: string;
}

export const notificationsApi = {
  getNotifications: async (
    params?: Record<string, any>,
  ): Promise<NotificationItem[]> => {
    const response = await api.get("/notifications", { params });
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  markAsRead: async (notification_id: number): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${notification_id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },
};
