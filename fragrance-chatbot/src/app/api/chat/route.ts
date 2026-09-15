import { NextRequest, NextResponse } from "next/server";
import { generateChatReply, type ChatTurn } from "@/lib/gemini";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { extractRecommendation } from "@/lib/recommendation";

type ChatRequestBody = {
  message: string;
  history: ChatTurn[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<ChatRequestBody>;

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message가 필요합니다." }, { status: 400 });
  }
  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const systemPrompt = buildSystemPrompt();
    const rawReply = await generateChatReply(systemPrompt, history, body.message);
    const { cleanText, recommendation } = extractRecommendation(rawReply);
    return NextResponse.json({ reply: cleanText, recommendation });
  } catch (err) {
    console.error("chat route error:", err);
    return NextResponse.json(
      { error: "챗봇 응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
