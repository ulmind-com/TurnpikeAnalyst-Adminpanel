import { request } from "@turnpike/shared/api/client";
import type { PageParams } from "@turnpike/shared/types/api";

export interface AssetResponse {
  _id: string;
  filename: string;
  url: string;
  content_type: string;
  size_bytes: number;
  uploaded_by?: string;
  created_at: string;
}

export const listAssets = (params?: PageParams) =>
  request<AssetResponse[]>({ url: "/cms/assets", method: "GET", params });
