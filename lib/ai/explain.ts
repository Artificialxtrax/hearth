import type { Intake, RankedMatch } from "@/lib/quotes/rank";

type AiRank = { id: string; reason: string; score: number };

function endpoint(): { url: string; key: string; model: string } | null {
  if (process.env.OPENAI_API_KEY) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  if (process.env.XAI_API_KEY) {
    return {
      url: "https://api.x.ai/v1/chat/completions",
      key: process.env.XAI_API_KEY,
      model: process.env.XAI_MODEL || "grok-2-latest",
    };
  }
  return null;
}

export async function explainMatches(intake: Intake, matches: RankedMatch[]): Promise<RankedMatch[]> {
  const ai = endpoint();
  if (!ai || matches.length === 0) return matches;
  try {
    const response = await fetch(ai.url, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        authorization: `Bearer ${ai.key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ai.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You rewrite insurance match explanations. Never say an outside carrier has agreed, pre-approved, or bound coverage. Desk matches may be called ready because they opted in on this marketplace. Outside carriers are only likely to quote. Return JSON {\"matches\":[{\"id\",\"reason\",\"score\"}]} using only the given ids. Scores are integers 1-99. Keep each reason under 280 characters.",
          },
          {
            role: "user",
            content: JSON.stringify({
              intake,
              matches: matches.map((match) => ({
                id: match.id,
                name: match.name,
                label: match.label,
                score: match.score,
                reason: match.reason,
                source: match.source,
              })),
            }),
          },
        ],
      }),
    });
    if (!response.ok) return matches;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return matches;
    const parsed = JSON.parse(content) as { matches?: AiRank[] };
    if (!parsed.matches) return matches;
    const byId = new Map(parsed.matches.map((item) => [item.id, item]));
    return matches
      .map((match) => {
        const update = byId.get(match.id);
        if (!update) return match;
        const score = Number.isFinite(update.score) ? Math.max(1, Math.min(99, Math.round(update.score))) : match.score;
        const reason = update.reason?.trim();
        return { ...match, score, reason: reason && reason.length > 20 ? reason : match.reason };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  } catch {
    return matches;
  }
}
