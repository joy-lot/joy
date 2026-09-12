"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Loader2, RefreshCw } from "lucide-react";
import { useActionState, useState } from "react";
import { generateCounselingCommentAction } from "@/app/counseling-comments/actions";
import { initialCounselingCommentFormState } from "@/app/counseling-comments/form-state";

type Audience = "student" | "parent";

export function CounselingCommentForm() {
  const [state, formAction, isPending] = useActionState(
    generateCounselingCommentAction,
    initialCounselingCommentFormState,
  );
  const [activeTab, setActiveTab] = useState<Audience>("student");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-1 text-sm">
            <span className="mb-1 block text-slate-600">학년</span>
            <input
              name="grade"
              type="number"
              min={1}
              max={6}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="col-span-1 text-sm">
            <span className="mb-1 block text-slate-600">반</span>
            <input
              name="className"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="col-span-1 text-sm">
            <span className="mb-1 block text-slate-600">이름</span>
            <input
              name="studentName"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">학업성적</span>
          <textarea
            name="academicSummary"
            rows={3}
            placeholder="예: 수학 62점(지난 학기 대비 하락), 영어는 꾸준히 상위권"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">교우관계</span>
          <textarea
            name="relationshipSummary"
            rows={3}
            placeholder="예: 짝과 잦은 다툼, 최근 소그룹에서 소외되는 모습"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">진로</span>
          <textarea
            name="careerSummary"
            rows={2}
            placeholder="예: 희망 진로 소프트웨어 개발자, 적성검사 결과 논리·수리형"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> 상담 멘트를 작성하고 있어요...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> 상담 멘트 생성하기
            </>
          )}
        </button>

        {state.status === "error" && (
          <p className="text-sm text-red-600">{state.errorMessage}</p>
        )}
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <AnimatePresence mode="wait">
          {state.status === "success" ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                <BadgeCheck className="h-3.5 w-3.5" /> AI 생성 초안 - 검토 후 사용하세요
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("student")}
                  className={`rounded-full px-3 py-1 text-sm ${
                    activeTab === "student"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  학생용 멘트
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("parent")}
                  className={`rounded-full px-3 py-1 text-sm ${
                    activeTab === "parent"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  학부모용 멘트
                </button>
              </div>

              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                {activeTab === "student" ? state.studentComment : state.parentComment}
              </p>

              {state.sourceDocuments && state.sourceDocuments.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1 text-xs text-slate-500">근거 문서</div>
                  <div className="flex flex-wrap gap-2">
                    {state.sourceDocuments.map((doc) => (
                      <span
                        key={doc}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-400"
            >
              왼쪽에 학생 정보를 입력하고 생성 버튼을 누르면 결과가 여기에 표시됩니다.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
