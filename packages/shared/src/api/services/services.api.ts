import { request } from "@turnpike/shared/api/client";
import type {
  MessageResponse,
  PageParams,
  ParentCategory,
  ServiceCreate,
  ServiceResponse,
  ServiceUpdate,
  SubServiceType,
} from "@turnpike/shared/types/api";

export interface ServiceListParams extends PageParams {
  parent_category?: ParentCategory;
  sub_service_type?: SubServiceType;
}

export const listServices = (params: ServiceListParams = {}) =>
  request<ServiceResponse[]>({ url: "/services/", method: "GET", params });

export const getService = (slug: string) =>
  request<ServiceResponse>({ url: `/services/${slug}`, method: "GET" });

export const createService = (payload: ServiceCreate) =>
  request<ServiceResponse>({ url: "/services/", method: "POST", data: payload });

export const updateService = (serviceId: string, payload: ServiceUpdate) =>
  request<ServiceResponse>({ url: `/services/${serviceId}`, method: "PUT", data: payload });

export const deleteService = (serviceId: string) =>
  request<MessageResponse>({ url: `/services/${serviceId}`, method: "DELETE" });
