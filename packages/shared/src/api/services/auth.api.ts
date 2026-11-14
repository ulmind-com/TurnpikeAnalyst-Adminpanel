import { apiClient, request } from "@turnpike/shared/api/client";
import type { LoginResponse, Token, UserCreate, UserResponse } from "@turnpike/shared/types/api";

/** POST /auth/login — OAuth2 password flow (form-encoded). */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  body.set("grant_type", "password");

  const { data } = await apiClient.post<LoginResponse>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export const loginWithGoogle = (firebase_token: string) =>
  request<LoginResponse>({ url: "/auth/google", method: "POST", data: { firebase_token } });

export const loginWithApple = (firebase_token: string) =>
  request<LoginResponse>({ url: "/auth/apple", method: "POST", data: { firebase_token } });

export const register = (payload: UserCreate) =>
  request<UserResponse>({ url: "/auth/register", method: "POST", data: payload });

/** Step 1 of email-verified sign-up: send a one-time code to the email. */
export const sendRegisterCode = (email: string, full_name: string) =>
  request<{ sent: boolean }>({
    url: "/auth/register/send-code",
    method: "POST",
    data: { email, full_name },
  });

export interface RegisterVerifyPayload {
  email: string;
  code: string;
  password: string;
  full_name?: string | null;
  company?: string | null;
}

/** Step 2: verify the code + set a password; returns a logged-in session. */
export const verifyRegister = (payload: RegisterVerifyPayload) =>
  request<LoginResponse>({ url: "/auth/register/verify", method: "POST", data: payload });

export const refreshToken = (refresh_token: string) =>
  request<Token>({ url: "/auth/refresh-token", method: "POST", data: { refresh_token } });

export const getMe = () => request<UserResponse>({ url: "/auth/me", method: "GET" });

export const updateMe = (payload: Partial<UserResponse>) => request<UserResponse>({ url: "/auth/me", method: "PATCH", data: payload });

