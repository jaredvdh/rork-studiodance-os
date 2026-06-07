/**
 * Shared CORS helper for StudioFlow Supabase Edge Functions.
 *
 * Browsers send a CORS preflight (OPTIONS) request with NO auth header before
 * the real request. Every function must:
 *   1. Reply to OPTIONS with a 2xx status and the CORS headers, BEFORE any
 *      auth/body parsing.
 *   2. Attach the same CORS headers to EVERY subsequent response (including
 *      errors), or the browser will block the response.
 *
 * Origin handling: we reflect the incoming Origin header when it is present so
 * the preview domain (*.rork.live), localhost dev, and future custom domains
 * all work without code changes. `Access-Control-Allow-Credentials` requires a
 * specific origin (never "*"), so reflecting the origin keeps credentials valid.
 */

/** Methods every function may receive (superset — harmless if a function only uses POST). */
const ALLOWED_METHODS = "GET, POST, OPTIONS";

/** Headers the browser is allowed to send on the actual request. */
const ALLOWED_HEADERS =
  "Content-Type, Authorization, apikey, x-client-info, stripe-signature";

/**
 * Build CORS headers for a given request, reflecting its Origin.
 * Falls back to "*" when no Origin header is present (e.g. server-to-server
 * calls like Stripe webhooks), in which case credentials are omitted.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

/** CORS headers plus JSON content type — use for JSON responses. */
export function jsonCorsHeaders(req: Request): Record<string, string> {
  return { ...corsHeaders(req), "Content-Type": "application/json" };
}

/**
 * If the request is a CORS preflight, return the 204 response to send.
 * Returns null for any non-OPTIONS request so the caller can continue.
 */
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}
