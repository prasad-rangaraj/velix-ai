import { api } from "@/utils/axios";

export const anonymousLogin = async (payload: {
  name?: string; email?: string; age_group?: string; gender?: string;
  profession?: string; device_fingerprint?: string;
}) => {
  const { data } = await api.POST<{ access_token: string; token_type: string; expires_in: number; onboarding_token: string }>(
    "/api/auth/anonymous", payload
  );
  return data;
};

export const sendAnonymousOTP = async (payload: { onboarding_token: string; name: string; email: string }) => {
  const { data } = await api.POST<{ message: string }>("/api/auth/anonymous/verification/send", payload);
  return data;
};

export const verifyAnonymousOTP = async (payload: { onboarding_token: string; code: string }) => {
  const { data } = await api.POST<{ message: string }>("/api/auth/anonymous/verification/verify", payload);
  return data;
};

export const convertAnonymousToUser = async (payload: {
  email: string; password: string; name?: string; onboarding_token: string;
}) => {
  const { data } = await api.POST<{ access_token: string; token_type: string }>("/api/auth/convert", payload);
  return data;
};

export const emailLogin = async (payload: { email: string; password: string }) => {
  const { data } = await api.POST<{ access_token: string; token_type: string; expires_in?: number }>(
    "/api/auth/login", payload
  );
  return data;
};

export const sendForgotPasswordOTP = async (payload: { email: string }) => {
  const { data } = await api.POST<{ message: string }>("/api/auth/forgot-password/send", payload);
  return data;
};

export const resetPassword = async (payload: { email: string; code: string; new_password: string }) => {
  const { data } = await api.POST<{ access_token: string; token_type: string; expires_in: number }>(
    "/api/auth/forgot-password/reset", payload
  );
  return data;
};
