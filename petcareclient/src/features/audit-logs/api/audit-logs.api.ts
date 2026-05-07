import apiClient from "@/lib/api";

export interface HistoryEntry {
    id: number;
    entity_type: "CUSTOMER" | "PRODUCT" | "SERVICE" | "ORDER" | "ROLE" | string;
    entity_id: number;
    action: "CREATED" | "UPDATED" | "CANCELLED" | "STOCK_CHANGED" | "REFUNDED" | string;
    performed_by: number;
    performed_by_name: string;
    old_values: any;
    new_values: any;
    created_at: string;
}

export const getRefInfo = (entry: HistoryEntry) => {
    const typeMap: Record<string, { type: string, label: string }> = {
        CUSTOMER: { type: "CUSTOMER", label: "Khách hàng" },
        PRODUCT: { type: "PRODUCT", label: "Sản phẩm" },
        SERVICE: { type: "SERVICE", label: "Dịch vụ" },
        ORDER: { type: "ORDER", label: "Hóa đơn" },
        ROLE: { type: "ROLE", label: "Quyền hạn" },
    };

    const info = typeMap[entry.entity_type] || { type: entry.entity_type, label: entry.entity_type };
    return { ...info, id: entry.entity_id };
};

export const getAuditLogs = async (params?: { entity_type?: string, performed_by?: number }): Promise<HistoryEntry[]> => {
    const response = await apiClient.get<HistoryEntry[]>("/stores/activity", { params });
    const data = Array.isArray(response.data) ? response.data : [];

    // Deduplicate using a composite key (type + id + timestamp)
    // This handles cases where different entity types share the same numeric ID
    const uniqueData = Array.from(
        new Map(
            data.map(item => [`${item.entity_type}-${item.id}-${item.created_at}`, item])
        ).values()
    );

    return uniqueData;
};

// These might still be useful for fetching history of a specific item if needed, 
// but the global activity endpoint is preferred for the main list.
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
