import { request } from "@turnpike/shared/api/client";
import type {
  ChatRequest,
  ChatResponse,
  ChatbotConversation,
  ChatbotSettings,
  KnowledgeEntry,
  KnowledgeEntryPayload,
} from "@turnpike/shared/types/chatbot";

const BASE = "/chatbot";

/** Greeting and enabled flag; safe to call before anyone has typed. */
export const getChatbotSettings = () =>
  request<ChatbotSettings>({ url: `${BASE}/settings`, method: "GET" });

export const sendChatMessage = (payload: ChatRequest) =>
  request<ChatResponse>({ url: `${BASE}/chat`, method: "POST", data: payload });

// --- Admin -----------------------------------------------------------------

const ADMIN = `${BASE}/admin`;

export const adminGetChatbotSettings = () =>
  request<ChatbotSettings>({ url: `${ADMIN}/settings`, method: "GET" });

export const adminUpdateChatbotSettings = (payload: Partial<ChatbotSettings>) =>
  request<ChatbotSettings>({ url: `${ADMIN}/settings`, method: "PATCH", data: payload });

export const adminListKnowledge = () =>
  request<KnowledgeEntry[]>({ url: `${ADMIN}/knowledge`, method: "GET" });

export const adminCreateKnowledge = (payload: KnowledgeEntryPayload) =>
  request<KnowledgeEntry>({ url: `${ADMIN}/knowledge`, method: "POST", data: payload });

export const adminUpdateKnowledge = (id: string, payload: Partial<KnowledgeEntryPayload>) =>
  request<KnowledgeEntry>({ url: `${ADMIN}/knowledge/${id}`, method: "PUT", data: payload });

export const adminDeleteKnowledge = (id: string) =>
  request<void>({ url: `${ADMIN}/knowledge/${id}`, method: "DELETE" });

export const adminListConversations = (unansweredOnly = false) =>
  request<ChatbotConversation[]>({
    url: `${ADMIN}/conversations`,
    method: "GET",
    params: { unanswered_only: unansweredOnly },
  });
