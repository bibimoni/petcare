import apiClient from "@/lib/api";

export interface UpdateProfilePayload {
  email: string;
  phone: string;
  address: string;
  full_name: string;
}

export interface UpdateProfileResponse {
  message: string;
  data: {
    email: string;
    phone: string;
    address: string;
    full_name: string;
  };
}

/**
 * Update user profile
 * PATCH /users/profile
 */
export const updateUserProfile = async (
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.patch<UpdateProfileResponse>(
    "/users/profile",
    payload,
  );
  return response.data;
};

/**
 * Leave store - Remove current user from staff
 * DELETE /stores/{storeId}/staff/me
 */
export const leaveStore = async (storeId: number): Promise<void> => {
  await apiClient.delete(`/stores/${storeId}/staff/me`);
};

/**
 * Delete store - Admin only
 * DELETE /stores/{storeId}
 */
export const deleteStore = async (storeId: number): Promise<void> => {
  await apiClient.delete(`/stores/${storeId}`);
};

/**
 * Get staff list to check if user is the last staff member
 */
export const getStaffListForStore = async (
  storeId: number,
): Promise<{ staff: Array<{ user_id: number; role: { name: string } }> }> => {
  const response = await apiClient.get(`/stores/${storeId}/staff`);
  return response.data;
};
