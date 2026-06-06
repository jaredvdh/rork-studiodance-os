const TOOLKIT_URL = import.meta.env.EXPO_PUBLIC_TOOLKIT_URL as string;
const TOOLKIT_KEY = import.meta.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY as string;

/** Call the Rork AI proxy for chat completions. Returns the assistant's text response. */
export async function aiChat(messages: Array<{ role: "system" | "user"; content: string }>): Promise<string> {
  const response = await fetch(`${TOOLKIT_URL}/v2/vercel/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOOLKIT_KEY}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.6",
      messages,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Suggest field mappings for CSV columns. */
export async function aiSuggestMappings(headers: string[]): Promise<Record<string, string>> {
  const prompt = `You are a data migration assistant for a studio management SaaS. Given these CSV column headers, suggest the best StudioFlow field mapping for each.

Available StudioFlow fields: name, caregiverName, caregiverEmail, caregiverPhone, caregiverAddress, dob, allergies, medicalNotes, emergencyContact, emergencyPhone, style, ageGroup, day, startTime, durationMins, room, capacity, teacherName, priceCents, email, styles, hourlyRateCents, payType, className, studentName, studentEmail, secondary_first_name, secondary_last_name, secondary_relationship, secondary_email, secondary_phone

CSV headers:
${headers.join("\n")}

Return ONLY a JSON object mapping each CSV header to its best-matching field name (or null for unmatched). Example: {"Student Name": "name", "Parent Email": "parentEmail", "Unknown Column": null}`;

  const result = await aiChat([
    { role: "user", content: prompt },
  ]);

  try {
    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* fall through */ }
  return {};
}

/** Generate an announcement draft. */
export async function aiDraftAnnouncement(context: string, scope: string): Promise<string> {
  const prompt = `You are a studio communication assistant. Write a warm, professional ${scope} announcement for a studio. 

Context: ${context}

Keep it concise (2-4 sentences), warm in tone, and studio-appropriate. Include any necessary action items or deadlines if relevant. Return only the announcement body text — no subject line, no formatting.`;

  return aiChat([{ role: "user", content: prompt }]);
}
