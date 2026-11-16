import { request } from "@turnpike/shared/api/client";
import type { LeadResponse, LeadStatus, PageParams } from "@turnpike/shared/types/api";

export interface LeadListParams extends PageParams {
  status?: LeadStatus;
}

export const listLeads = (params: LeadListParams = {}) =>
  request<LeadResponse[]>({ url: "/leads/", method: "GET", params });

export const updateLeadStatus = (leadId: string, status: LeadStatus) =>
  request<LeadResponse>({ url: `/leads/${leadId}/status`, method: "PATCH", data: { status } });

export const bookCall = (payload: Record<string, unknown>) =>
  request({ url: "/leads/book-call", method: "POST", data: payload });

export const submitNeeds = (payload: Record<string, unknown>) =>
  request({ url: "/leads/submit-needs", method: "POST", data: payload });

export const submitSupportTicket = (payload: {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
}) =>
  request<LeadResponse>({
    url: "/leads/book-call",
    method: "POST",
    data: {
      type: "BOOK_CALL",
      full_name: `${payload.first_name} ${payload.last_name}`.trim(),
      email: payload.email,
      phone: "",
      company: "",
      department: "HELP_DESK",
      subject: payload.subject,
      message: payload.message,
    },
  });
