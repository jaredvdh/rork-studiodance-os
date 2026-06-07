/**
 * Edge Function: ai-proxy
 *
 * Server-side proxy for Rork AI Toolkit chat completions. This keeps the
 * Rork Toolkit key OUT of the client bundle: the browser sends only the
 * user's auth token, and this function attaches the toolkit credentials
 * server-side.
 *
 * POST /functions/v1/ai-proxy
 * Headers: Authorization: Bearer <rork access token>
 * Body: { messages: Array<{ role, content }>, maxTokens?: number, model?: string }
 *
 * Required Supabase Edge Function secrets:
 *   RORK_TOOLKIT_URL          (e.g. https://toolkit.rork.com)
 *   RORK_TOOLKIT_SECRET_KEY   (the toolkit proxy key — server-side only)
 */

import { requireAuth, AuthError } from "../_shared/auth.ts";

const TOOLKIT_URL = Deno.env.get("RORK_TOOLKIT_URL") ?? "";
const TOOLKIT_KEY = Deno.env.get("RORK_TOOLKIT_SECRET_KEY") ?? "";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";

const corsHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProxyBody {
  messages: ChatMessage[];
  maxTokens?: number;
  model?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Only authenticated users may spend AI credits.
    await requireAuth(req);

    if (!TOOLKIT_URL || !TOOLKIT_KEY) {
      return new Response(
        JSON.stringify({ error: "AI is not configured for this project" }),
        { status: 503, headers: corsHeaders },
      );
    }

    const { messages, maxTokens, model } = (await req.json()) as ProxyBody;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const res = await fetch(`${TOOLKIT_URL}/v2/vercel/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOOLKIT_KEY}`,
      },
      body: JSON.stringify({
        model: model ?? DEFAULT_MODEL,
        messages,
        max_tokens: Math.min(Math.max(maxTokens ?? 1000, 1), 4000),
      }),
    });

    if (!res.ok) {
      console.error("ai-proxy upstream error:", res.status);
      return new Response(
        JSON.stringify({ error: `AI request failed: ${res.status}` }),
        { status: 502, headers: corsHeaders },
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), { headers: corsHeaders });
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    console.error("ai-proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
