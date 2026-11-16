/**
 * Security headers stamped onto every server-rendered response.
 *
 * These are also declared in each app's `vercel.json`, but that file is not
 * the thing we rely on: under the Build Output API the framework writes its
 * own route table, and whether Vercel still merges `headers` from
 * `vercel.json` is not something this repository can verify. Setting them
 * here means the headers travel with the response itself, on Vercel and on
 * Cloudflare alike, whatever the platform does with the route table.
 *
 * Only document responses pass through here. Static assets are served by the
 * platform's filesystem handler with their own correct content types, so the
 * `vercel.json` declaration remains useful for those.
 */

export type SecurityHeaderOptions = {
  /** `SAMEORIGIN` for the public site; `DENY` for the console. */
  frameOptions: "SAMEORIGIN" | "DENY";
  /** Set for the console, which must not appear in search results. */
  noindex?: boolean;
};

export function securityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": options.frameOptions,
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  if (options.noindex) headers["X-Robots-Tag"] = "noindex, nofollow";
  return headers;
}

/**
 * Returns a response carrying the headers. Streams through untouched: the
 * body is passed by reference, never read, so server-side rendering keeps
 * flushing incrementally.
 *
 * A `Response` that came from `fetch()` has a guarded header list and throws
 * on mutation; rebuilding covers that case without buffering.
 */
export function withSecurityHeaders(
  response: Response,
  options: SecurityHeaderOptions,
): Response {
  const headers = securityHeaders(options);
  try {
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch {
    const merged = new Headers(response.headers);
    for (const [key, value] of Object.entries(headers)) merged.set(key, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: merged,
    });
  }
}
