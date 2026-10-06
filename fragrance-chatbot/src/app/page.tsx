"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, X, Feather, RotateCcw } from "lucide-react";
import ScentFairy from "@/components/ScentFairy";
import BrandBanner from "@/components/BrandBanner";
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
  const [reactTrigger, setReactTrigger] = useState(0);
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
      setReactTrigger((n) => n + 1);
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
    <main className="mx-auto flex h-screen max-w-[100rem] flex-col gap-4 px-4 py-6 lg:flex-row lg:py-8">
      <section className="relative h-48 shrink-0 overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-b from-white/50 to-pink-100/60 shadow-inner lg:h-auto lg:w-[52%]">
        <ScentFairy reactTrigger={reactTrigger} />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] text-pink-500 shadow-sm backdrop-blur-sm">
            향기요정을 클릭하거나 움직여보세요 ✨
          </span>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
      <BrandBanner />

      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-pink-100 bg-white/70 p-4 shadow-inner backdrop-blur-sm">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-neutral-500">
              몇 가지 질문에 답하면
              <br />
              나에게 어울리는 향을 찾아드릴게요!
            </p>
            <button
              onClick={() => sendMessage(STARTER_PROMPT)}
              className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-pink-700 shadow-sm transition hover:bg-pink-50 hover:shadow"
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
              className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {m.role === "model" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className="flex max-w-[75%] flex-col items-start">
                <motion.div
                  animate={m.role === "user" ? { y: [0, -4, 0] } : undefined}
                  transition={
                    m.role === "user"
                      ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                      : undefined
                  }
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-pink-500 to-rose-400 text-white"
                      : "rounded-bl-md border border-pink-100 bg-white text-neutral-800"
                  }`}
                >
                  {m.text}
                </motion.div>
                {m.recommendation && (
                  <button
                    onClick={() => setActiveRecommendation(m.recommendation!)}
                    className="mt-1.5 flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 transition hover:bg-pink-200"
                  >
                    <Sparkles className="h-3 w-3" />
                    추천 카드 다시 보기
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-end gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-pink-100 bg-white px-4 py-2.5 text-sm text-neutral-500 shadow-sm">
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
          className="flex-1 rounded-full border border-pink-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-sm transition hover:shadow-md disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      </section>

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
              className="relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            >
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-400 px-6 pb-9 pt-5 text-center">
                <div className="pointer-events-none absolute inset-0 opacity-30">
                  <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
                  <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
                </div>

                <button
                  onClick={() => setActiveRecommendation(null)}
                  className="absolute right-4 top-4 text-white/80 transition hover:text-white"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>

                <span className="relative inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  ✨ {activeRecommendation.matchScore}% 매치
                </span>

                <div className="relative mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
                <h2 className="text-center font-display text-2xl leading-snug text-neutral-800">
                  {activeRecommendation.title}
                </h2>

                {activeRecommendation.vibeTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
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

                <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-sky-50 px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100">
                    <Feather className="h-3.5 w-3.5 text-sky-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400">잔향감</p>
                    <p className="text-xs font-medium text-neutral-700">{activeRecommendation.sillage}</p>
                  </div>
                </div>

                <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-600">
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
                    className="flex-1 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                  >
                    확인!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
