"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, X, Wind, Flower2, Leaf, Clock, Feather, RotateCcw } from "lucide-react";
import type { ChatTurn } from "@/lib/gemini";
import type { Recommendation } from "@/lib/recommendation";

type Message = {
  role: "user" | "model";
  text: string;
  recommendation?: Recommendation;
};

const STARTER_PROMPT = "나에게 어울리는 향을 추천해줘!";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "오류가 발생했어요.");

      const recommendation: Recommendation | null = data.recommendation ?? null;
      setMessages((prev) => [...prev, { role: "model", text: data.reply, recommendation: recommendation ?? undefined }]);
      if (recommendation) setActiveRecommendation(recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setMessages([]);
    setInput("");
    setError(null);
    setActiveRecommendation(null);
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-200">
          <Sparkles className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-pink-700">향기요정</h1>
          <p className="text-xs text-neutral-500">대화로 나에게 맞는 향을 찾아드려요</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-4 shadow-inner">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-neutral-500">
              몇 가지 질문에 답하면
              <br />
              나에게 어울리는 향을 찾아드릴게요!
            </p>
            <button
              onClick={() => sendMessage(STARTER_PROMPT)}
              className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-pink-700 shadow-sm transition hover:bg-pink-50"
            >
              <Sparkles className="h-4 w-4" />
              나에게 맞는 향 추천받기
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
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
              {m.recommendation && (
                <button
                  onClick={() => setActiveRecommendation(m.recommendation!)}
                  className="mt-1.5 flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 transition hover:bg-pink-200"
                >
                  <Sparkles className="h-3 w-3" />
                  추천 카드 다시 보기
                </button>
              )}
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

      <AnimatePresence>
        {activeRecommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveRecommendation(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <button
                onClick={() => setActiveRecommendation(null)}
                className="absolute right-4 top-4 text-neutral-400 transition hover:text-neutral-600"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-1 flex justify-center">
                <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-3 py-1 text-xs font-bold text-white">
                  ✨ {activeRecommendation.matchScore}% 매치
                </span>
              </div>

              <div className="mb-4 flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100">
                  <Sparkles className="h-7 w-7 text-pink-600" />
                </div>
                <h2 className="text-xl font-bold text-neutral-800">{activeRecommendation.title}</h2>
                <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
                  {activeRecommendation.family}
                </span>
              </div>

              <div className="space-y-3">
                <NoteRow icon={Wind} label="탑노트" notes={activeRecommendation.topNotes} color="amber" />
                <NoteRow icon={Flower2} label="미들노트" notes={activeRecommendation.heartNotes} color="pink" />
                <NoteRow icon={Leaf} label="베이스노트" notes={activeRecommendation.baseNotes} color="violet" />
              </div>

              {activeRecommendation.vibeTags.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {activeRecommendation.vibeTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
                  <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-[10px] font-medium text-neutral-400">지속력</p>
                    <p className="text-xs text-neutral-700">{activeRecommendation.longevity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
                  <Feather className="h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-[10px] font-medium text-neutral-400">잔향감</p>
                    <p className="text-xs text-neutral-700">{activeRecommendation.sillage}</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {activeRecommendation.description}
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={restart}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-pink-200 py-2.5 text-sm font-semibold text-pink-600 transition hover:bg-pink-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  다시 추천받기
                </button>
                <button
                  onClick={() => setActiveRecommendation(null)}
                  className="flex-1 rounded-full bg-pink-500 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
                >
                  확인!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function NoteRow({
  icon: Icon,
  label,
  notes,
  color,
}: {
  icon: typeof Wind;
  label: string;
  notes: string[];
  color: "amber" | "pink" | "violet";
}) {
  if (notes.length === 0) return null;

  const colorClasses: Record<typeof color, string> = {
    amber: "bg-amber-100 text-amber-700",
    pink: "bg-pink-100 text-pink-700",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="flex items-start gap-2">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colorClasses[color]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        <span className="mr-1 text-xs font-medium text-neutral-500">{label}</span>
        {notes.map((note) => (
          <span key={note} className={`rounded-full px-2 py-0.5 text-xs ${colorClasses[color]}`}>
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}
