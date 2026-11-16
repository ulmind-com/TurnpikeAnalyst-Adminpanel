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

/**
 * Resolves a certificate PDF URL for direct download.
 * Handles Cloudinary URLs (attaches fl_attachment for forced browser download)
 * and relative local paths (prefixes API_BASE_URL).
 */
export function getCertificateDownloadUrl(pdfUrl?: string | null, certNumber?: string): string {
  if (!pdfUrl) {
    if (certNumber) {
      return `${API_BASE_URL}/api/v1/internship/certificates/${certNumber}/download`;
    }
    return "";
  }
  let url = pdfUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const base = API_BASE_URL.replace(/\/$/, "");
    const path = url.startsWith("/") ? url : `/${url}`;
    url = `${base}${path}`;
  }
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const filename = certNumber ? `Turnpike-Certificate-${certNumber}` : "Turnpike-Certificate";
    if (!url.includes("fl_attachment")) {
      url = url.replace("/upload/", `/upload/fl_attachment:${filename}/`);
    }
  }
  return url;
}

