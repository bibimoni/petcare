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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const login = async (payload: LoginPayload) => {
  try {
    return await axiosClient.post(`/auth/login`, payload);
  } catch (error) {
    handleApiError(error);
  }
};

export const register = async (payload: RegisterPayload) => {
  try {
    return await axiosClient.post(`/auth/register`, payload);
  } catch (error) {
    handleApiError(error);
  }
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  try {
    return await axiosClient.post(`/auth/forgot-password`, payload);
  } catch (error) {
    handleApiError(error);
  }
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  try {
    return await axiosClient.post(`/auth/reset-password`, {
      token: payload.token,
      new_password: payload.newPassword,
    });
  } catch (error) {
    handleApiError(error);
  }
};
