export type Recommendation = {
  title: string;
  matchScore: number;
  vibeTags: string[];
  longevity: string;
  sillage: string;
  description: string;
};

const START_MARKER = "<<<RECOMMENDATION>>>";
const END_MARKER = "<<<END>>>";

function isRecommendation(value: unknown): value is Recommendation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.matchScore === "number" &&
    Array.isArray(v.vibeTags) &&
    typeof v.longevity === "string" &&
    typeof v.sillage === "string" &&
    typeof v.description === "string"
  );
}

export function extractRecommendation(text: string): {
  cleanText: string;
  recommendation: Recommendation | null;
} {
  const startIdx = text.indexOf(START_MARKER);
  const endIdx = text.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return { cleanText: text.trim(), recommendation: null };
  }

  const jsonPart = text.slice(startIdx + START_MARKER.length, endIdx).trim();
  const cleanText = (text.slice(0, startIdx) + text.slice(endIdx + END_MARKER.length)).trim();

  try {
    const parsed: unknown = JSON.parse(jsonPart);
    return { cleanText, recommendation: isRecommendation(parsed) ? parsed : null };
  } catch {
    return { cleanText, recommendation: null };
  }
}
