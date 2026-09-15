import { GoogleGenAI } from "@google/genai";

export type ChatTurn = {
  role: "user" | "model";
  text: string;
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local을 확인하세요.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateChatReply(
  systemPrompt: string,
  history: ChatTurn[],
  message: string
): Promise<string> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

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
}
