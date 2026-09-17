import { GoogleGenAI } from "@google/genai";

export type ChatTurn = {
  role: "user" | "model";
  text: string;
};

function getApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS;
  if (multi && multi.trim()) {
    const keys = multi
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length > 0) return keys;
  }

  const single = process.env.GEMINI_API_KEY;
  if (single) return [single];

  throw new Error(
    "GEMINI_API_KEY(S)가 설정되어 있지 않습니다. .env.local을 확인하세요."
  );
}

const clients = new Map<string, GoogleGenAI>();

function getClient(apiKey: string): GoogleGenAI {
  let client = clients.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clients.set(apiKey, client);
  }
  return client;
}

function isRateLimitError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: unknown }).status === 429
  );
}

// Round-robin starting point across warm invocations, so load spreads evenly
// across keys instead of always hammering the first one.
let rotationIndex = 0;

export async function generateChatReply(
  systemPrompt: string,
  history: ChatTurn[],
  message: string
): Promise<string> {
  const keys = getApiKeys();
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

  const startIndex = rotationIndex % keys.length;
  rotationIndex = (rotationIndex + 1) % keys.length;

  let lastError: unknown;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(startIndex + attempt) % keys.length];
    try {
      const ai = getClient(key);
      const chat = ai.chats.create({
        model,
        config: { systemInstruction: systemPrompt },
        history: history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
      });
      const response = await chat.sendMessage({ message });
      return response.text ?? "";
    } catch (err) {
      lastError = err;
      // A rate-limited key means we should try the next one, not give up.
      if (!isRateLimitError(err)) throw err;
    }
  }

  throw lastError;
}
