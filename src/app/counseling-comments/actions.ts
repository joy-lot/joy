"use server";

import type { CounselingIntake } from "@/domain/entities/counseling-intake";
import { generateCounselingComment } from "@/application/use-cases/generate-counseling-comment/generate-counseling-comment";
import { createLlmPort, createVectorSearchPort } from "@/lib/container";
import type { CounselingCommentFormState } from "./form-state";

function readIntakeFromForm(formData: FormData): CounselingIntake {
  const studentName = String(formData.get("studentName") ?? "").trim();
  const grade = Number(formData.get("grade") ?? 0);
  const className = String(formData.get("className") ?? "").trim();

  if (!studentName) {
    throw new Error("학생 이름을 입력하세요.");
  }

  return {
    studentName,
    grade,
    className,
    academicSummary: String(formData.get("academicSummary") ?? "").trim(),
    relationshipSummary: String(formData.get("relationshipSummary") ?? "").trim(),
    careerSummary: String(formData.get("careerSummary") ?? "").trim(),
  };
}

export async function generateCounselingCommentAction(
  _prevState: CounselingCommentFormState,
  formData: FormData,
): Promise<CounselingCommentFormState> {
  try {
    const intake = readIntakeFromForm(formData);

    const result = await generateCounselingComment(
      { llm: createLlmPort(), vectorSearch: createVectorSearchPort() },
      { intake },
    );

    return {
      status: "success",
      studentComment: result.studentComment,
      parentComment: result.parentComment,
      sourceDocuments: result.sourceDocuments,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
