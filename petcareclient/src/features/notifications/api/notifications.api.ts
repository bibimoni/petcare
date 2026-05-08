import api from "@/lib/api";

export const NotificationType = {
  LOW_STOCK: "LOW_STOCK",
  EXPIRY_WARNING: "EXPIRY_WARNING",
  EXPIRED: "EXPIRED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  STORE_INVITATION: "STORE_INVITATION",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationStatus = {
  UNREAD: "UNREAD",
  READ: "READ",
  ARCHIVED: "ARCHIVED",
} as const;

export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

export interface NotificationItem {
  title: string;
  message: string;
  store_id: number;
  created_at: string;
  updated_at: string;
  type: NotificationType;
  notification_id: number;
  user_id?: number | null;
  product_id?: number | null;
  status: NotificationStatus;
  action_url?: string | null;
  product_name?: string | null;
}

export const notificationsApi = {
  getNotifications: async (
    params?: Record<string, any>,
  ): Promise<NotificationItem[]> => {
    const response = await api.get("/notifications/user", { params });
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  markAsRead: async (notification_id: number): Promise<NotificationItem> => {
    const response = await api.patch(
      `/notifications/${notification_id}/mark-read`,
    );
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.patch("/notifications/mark-read-batch");
    return response.data;
  },
};
