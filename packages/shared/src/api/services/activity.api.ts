import { request } from "@turnpike/shared/api/client";
import type { PageParams } from "@turnpike/shared/types/api";

export interface ActivityLogResponse {
  _id: string;
  action: string;
  resource: string;
  user_id?: string;
  user_name?: string;
  details?: Record<string, any>;
  created_at: string;
}

export const listActivityLogs = (params?: PageParams) =>
  request<ActivityLogResponse[]>({ url: "/activity-logs", method: "GET", params });
