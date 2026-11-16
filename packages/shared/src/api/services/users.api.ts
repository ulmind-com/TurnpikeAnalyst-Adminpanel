import { request } from "@turnpike/shared/api/client";
import type { PageParams, UserResponse } from "@turnpike/shared/types/api";

export const listUsers = (params?: PageParams) =>
  request<UserResponse[]>({ url: "/users", method: "GET", params });

export const createUser = (data: Partial<UserResponse> & { password?: string }) =>
  request<UserResponse>({ url: "/users", method: "POST", data });

export const updateUser = (userId: string, data: Partial<UserResponse>) =>
  request<UserResponse>({ url: `/users/${userId}`, method: "PUT", data });

export const deleteUser = (userId: string) =>
  request<void>({ url: `/users/${userId}`, method: "DELETE" });
