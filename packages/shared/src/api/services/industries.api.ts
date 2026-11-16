import { request } from "@turnpike/shared/api/client";
import type {
  IndustryCreate,
  IndustryResponse,
  IndustryUpdate,
  MessageResponse,
  PageParams,
} from "@turnpike/shared/types/api";

export interface IndustryListParams extends PageParams {
  parent_category?: string;
}

export const listIndustries = (params: IndustryListParams = {}) =>
  request<IndustryResponse[]>({ url: "/content/industries", method: "GET", params });

export const getIndustry = (slug: string) =>
  request<IndustryResponse>({ url: `/content/industries/${slug}`, method: "GET" });

export const createIndustry = (payload: IndustryCreate) =>
  request<IndustryResponse>({ url: "/content/industries", method: "POST", data: payload });

export const updateIndustry = (industryId: string, payload: IndustryUpdate) =>
  request<IndustryResponse>({ url: `/content/industries/${industryId}`, method: "PUT", data: payload });

export const deleteIndustry = (industryId: string) =>
  request<MessageResponse>({ url: `/content/industries/${industryId}`, method: "DELETE" });
