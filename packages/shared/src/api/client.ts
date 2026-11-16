import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, API_KEY, API_PREFIX } from "@turnpike/shared/constants/config";
import { useAuthStore } from "@turnpike/shared/store/auth-store";

export interface ApiErrorShape {
  status: number;
  message: string;
  detail?: unknown;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Bare instance used for token refresh so interceptors never recurse. */
const bareClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

/**
 * Where to send a browser whose session could not be refreshed.
 *
 * The two applications sharing this client have different sign-in routes —
 * the console has /login, the public site sends interns somewhere else — so
 * the path is set by the app at startup rather than hardcoded here.
 */
let unauthorizedRedirect = "/login";

export function setUnauthorizedRedirect(path: string): void {
  unauthorizedRedirect = path;
}

const attachHeaders = (config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  if (API_KEY) config.headers.set("x-api-key", API_KEY);
  // A FormData body carries its own multipart boundary. Leaving the
  // instance-wide JSON content type in place would send a boundary-less
  // header and the upload would be rejected as malformed.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
};

apiClient.interceptors.request.use(attachHeaders);
bareClient.interceptors.request.use((config) => {
  if (API_KEY) config.headers.set("x-api-key", API_KEY);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const { data } = await bareClient.post<{ access_token: string; refresh_token: string }>(
      "/auth/refresh-token",
      { refresh_token: refreshToken },
    );
    setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
    return data.access_token;
  } catch {
    clear();
    return null;
  }
}

export function requestTokenRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && config && !config._retry) {
      config._retry = true;
      const token = await requestTokenRefresh();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
        return apiClient.request(config);
      }
      useAuthStore.getState().clear();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith(unauthorizedRedirect)
      ) {
        window.location.assign(
          `${unauthorizedRedirect}?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export function normalizeError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;

    let message: string;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : String(item),
        )
        .join(", ");
    } else if (status === 0) {
      message = "Unable to reach the Turnpike API. Check your connection and try again.";
    } else {
      message = error.message;
    }

    return { status, message, detail };
  }

  return { status: 0, message: error instanceof Error ? error.message : "Unexpected error" };
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.request<T>(config);
  return data;
}
