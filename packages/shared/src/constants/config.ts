/**
 * Runtime configuration. Values come from environment variables so that no
 * credential or host is ever hardcoded in application code.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://turnpikeanalyst-backend.onrender.com";

/** Optional gateway key. Sent as `x-api-key` on every request when present. */
export const API_KEY: string = (import.meta.env.VITE_API_KEY as string | undefined) ?? "";

export const API_PREFIX = "/api/v1";

export const STORAGE_KEYS = {
  auth: "turnpike.auth.v1",
  sidebar: "turnpike.sidebar.v1",
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
