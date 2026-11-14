/** Types for the support chatbot, mirroring app/schemas/chatbot.py. */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatTurn[];
  conversation_id?: string | null;
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  /** Which provider in the chain answered — useful when one is degraded. */
  answered_by: string;
  /** Knowledge entries the answer was grounded in. */
  sources: string[];
  /** Suggested follow-up questions, shown as clickable chips. */
  suggestions?: string[];
  /** Nothing matched; a person should probably follow up. */
  needs_human: boolean;
}

export interface ChatbotSettings {
  enabled: boolean;
  greeting: string;
  persona: string;
  fallback_message: string;
  updated_at: string;
}

export interface KnowledgeEntry {
  _id: string;
  question: string;
  answer: string;
  topic: string;
  keywords: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type KnowledgeEntryPayload = Omit<
  KnowledgeEntry,
  "_id" | "created_at" | "updated_at"
>;

export interface ChatbotConversation {
  _id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  needs_human: boolean;
  user_id?: string | null;
  turns: ChatTurn[];
}
