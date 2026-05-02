import apiClient from "@/lib/api";

export type Role = {
  id: number;
  name: string;
  description: string;
};

export type StaffMember = {
  role: Role;
  email: string;
  phone: string;
  status: string;
  user_id: number;
  role_id: number;
  full_name: string;
  created_at: string;
};

export type GetStaffResponse = {
  total: number;
  store_id: number;
  staff: StaffMember[];
};

export type InviteStaffRequest = {
  email: string;
  role_id: number;
  message?: string;
};

export const getStaffList = async (
  storeId: number,
): Promise<GetStaffResponse> => {
  const response = await apiClient.get<GetStaffResponse>(
    `/stores/${storeId}/staff`,
  );
  return response.data;
};

export const inviteStaff = async (
  storeId: number,
  data: InviteStaffRequest,
): Promise<void> => {
  await apiClient.post(`/stores/${storeId}/invite`, data);
};

export const deleteStaff = async (
  storeId: number,
  userId: number,
): Promise<void> => {
  await apiClient.delete(`/stores/${storeId}/staff/${userId}`);
};

export type User = {
  email: string;
  phone?: string;
  user_id: number;
  avatar?: string;
  full_name: string;
  role?: {
    id: number;
    name: string;
  } | null;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>(
    "/users?status=ACTIVE&in_store=NOT_IN_STORE",
  );
  return response.data.filter((user) => user.role?.name !== "SUPER_ADMIN");
};

export type StoreRole = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  permissions: any[];
  description: string;
  is_editable: boolean;
  is_system_role: boolean;
};

export const getStoreRoles = async (storeId: number): Promise<StoreRole[]> => {
  const response = await apiClient.get<StoreRole[]>(`/stores/${storeId}/roles`);
  return response.data;
};

export type CreateStoreRolePayload = {
  name: string;
  description: string;
  permission_ids: number[];
};

export const createStoreRole = async (
  storeId: number,
  payload: CreateStoreRolePayload,
): Promise<StoreRole> => {
  const response = await apiClient.post<StoreRole>(
    `/stores/${storeId}/roles`,
    payload,
  );
  return response.data;
};
