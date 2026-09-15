"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, FlaskConical, Loader2 } from "lucide-react";
import type { ChatTurn } from "@/lib/gemini";
import type { GradeLevel } from "@/lib/systemPrompt";

type Message = {
  role: "user" | "model";
  text: string;
};

const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: "elementary", label: "초등학생" },
  { value: "middle", label: "중학생" },
  { value: "high", label: "고등학생" },
];

const STARTER_PROMPTS = [
  { icon: Sparkles, label: "나에게 맞는 향 추천받기", text: "나에게 어울리는 향을 추천해줘!" },
  { icon: FlaskConical, label: "향수 만드는 법 배우기", text: "집에서 안전하게 향수 만드는 방법을 알려줘!" },
];

export default function Home() {
  const [grade, setGrade] = useState<GradeLevel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!grade || !text.trim() || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history: ChatTurn[] = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, grade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "오류가 발생했어요.");
      setMessages([...nextMessages, { role: "model", text: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  if (!grade) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-200">
            <Sparkles className="h-8 w-8 text-pink-600" />
          </div>
          <h1 className="text-2xl font-bold text-pink-700">향기요정</h1>
          <p className="max-w-sm text-sm text-neutral-600">
            대화를 통해 나에게 어울리는 향을 찾고, 안전하게 향수 만드는 법도 배워봐요.
            <br />
            먼저 학년을 알려주세요!
          </p>
        </motion.div>
        <div className="flex gap-3">
          {GRADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGrade(opt.value)}
              className="rounded-full border border-pink-300 bg-white px-5 py-2.5 text-sm font-medium text-pink-700 shadow-sm transition hover:bg-pink-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-200">
          <Sparkles className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-pink-700">향기요정</h1>
          <p className="text-xs text-neutral-500">
            {GRADE_OPTIONS.find((o) => o.value === grade)?.label} 모드
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-4 shadow-inner">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 py-6">
            <p className="text-center text-sm text-neutral-500">무엇을 도와줄까요?</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.text)}
                  className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-pink-700 shadow-sm transition hover:bg-pink-50"
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-pink-500 text-white"
                    : "border border-pink-100 bg-white text-neutral-800"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              향기요정이 생각하고 있어요...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 rounded-full border border-pink-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white transition hover:bg-pink-600 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </main>
  );
}
