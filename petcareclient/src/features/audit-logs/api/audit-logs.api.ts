import apiClient from "@/lib/api";

export interface HistoryEntry {
    id: number;
    store_id: number;
    action: "CREATED" | "UPDATED" | "CANCELLED" | string;
    performed_by: number;
    performed_by_name: string;
    old_values: any;
    new_values: any;
    created_at: string;
    // Resource specific IDs
    order_id?: number;
    product_id?: number;
    service_id?: number;
    role_id?: number;
}

export interface ActivityItem {
    type: string;
    title: string;
    created_at: string;
    description: string;
    reference_id: number;
    reference_type: "ORDER" | "PRODUCT" | "SERVICE" | "ROLE" | string;
}

export interface AuditLogsResponse {
    activities: ActivityItem[];
}

export const getAuditLogs = async (limit = 50): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ActivityItem[]>(
        `/analytics/activities?limit=${limit}`,
    );
    return Array.isArray(response.data) ? response.data : [];
};

export const getOrderHistory = async (orderId: number): Promise<HistoryEntry[]> => {
    const response = await apiClient.get<HistoryEntry[]>(`/orders/${orderId}/history`);
    return Array.isArray(response.data) ? response.data : [];
};

export const getProductHistory = async (productId: number): Promise<HistoryEntry[]> => {
    const response = await apiClient.get<HistoryEntry[]>(`/products/${productId}/history`);
    return Array.isArray(response.data) ? response.data : [];
};

export const getServiceHistory = async (serviceId: number): Promise<HistoryEntry[]> => {
    const response = await apiClient.get<HistoryEntry[]>(`/services/${serviceId}/history`);
    return Array.isArray(response.data) ? response.data : [];
};

export const getRoleHistory = async (storeId: number, roleId: number): Promise<HistoryEntry[]> => {
    const response = await apiClient.get<HistoryEntry[]>(`/stores/${storeId}/roles/${roleId}/history`);
    return Array.isArray(response.data) ? response.data : [];
};
