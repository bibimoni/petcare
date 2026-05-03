import axiosClient from "@/lib/api";

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
  return await axiosClient.post(`/auth/login`, payload);
};

export const register = async (payload: RegisterPayload) => {
  return await axiosClient.post(`/auth/register`, payload);
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  return await axiosClient.post(`/auth/forgot-password`, payload);
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  return await axiosClient.post(`/auth/reset-password?token=${payload.token}`, {
    new_password: payload.newPassword,
  });
};
