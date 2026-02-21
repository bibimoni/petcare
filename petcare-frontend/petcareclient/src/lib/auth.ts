import axiosClient, { handleApiError } from "@/lib/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  phone?: string;
  password: string;
  address?: string;
  fullName?: string;
}

export const login = async (payload: LoginPayload) => {
  try {
    return await axiosClient.post(`/auth/login`, payload);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const register = async (payload: RegisterPayload) => {
  try {
    return await axiosClient.post(`/auth/register`, payload);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
