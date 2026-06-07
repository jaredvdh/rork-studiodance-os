/**
 * Client-side caller for the server-side AI proxy edge function.
 *
 * The Rork Toolkit key is NEVER bundled into the client. Instead we send the
 * user's auth token to the `ai-proxy` edge function, which attaches the
 * toolkit credentials server-side. All AI features are optional enhancements
 * and degrade gracefully when AI is unconfigured or unreachable.
 */

import { getAccessToken } from "./supabase";
import { getFunctionUrl } from "./supabaseFunctions";

function aiProxyUrl(): string | null {
  return getFunctionUrl("ai-proxy");
}

/** Whether the AI proxy is reachable in this environment. */
export function isAIConfigured(): boolean {
  return aiProxyUrl() !== null;
}

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Run a chat completion through the server-side proxy.
 * Returns the assistant's text response.
 * @throws if AI is not configured or the request fails.
 */
export async function aiChatCompletion(
  messages: AIChatMessage[],
  maxTokens = 1000,
): Promise<string> {
  const url = aiProxyUrl();
  if (!url) throw new Error("AI is not configured");

  const token = getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI request failed: ${res.status}`);
  }

  const data = await res.json();
  return (data.content as string) ?? "";
}
