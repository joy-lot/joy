import { NextRequest, NextResponse } from "next/server";
import { generateChatReply, type ChatTurn } from "@/lib/gemini";
import { buildSystemPrompt, type GradeLevel } from "@/lib/systemPrompt";

type ChatRequestBody = {
  message: string;
  history: ChatTurn[];
  grade: GradeLevel;
};

function isValidGrade(value: unknown): value is GradeLevel {
  return value === "elementary" || value === "middle" || value === "high";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<ChatRequestBody>;

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message가 필요합니다." }, { status: 400 });
  }
  if (!isValidGrade(body.grade)) {
    return NextResponse.json({ error: "grade가 올바르지 않습니다." }, { status: 400 });
  }
  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const systemPrompt = buildSystemPrompt(body.grade);
    const reply = await generateChatReply(systemPrompt, history, body.message);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "챗봇 응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
