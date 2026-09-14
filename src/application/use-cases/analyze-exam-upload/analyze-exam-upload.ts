import type { LlmPort } from "../../../domain/ports/llm-port";
import type { VectorSearchPort } from "../../../domain/ports/vector-search-port";
import {
  computeUnitAchievements,
  selectWeakUnits,
  type ExamQuestionResult,
} from "../../../domain/services/achievement-calculator";
import type { UnitAchievement } from "../../../domain/value-objects/achievement-level";
import { extractJsonFromLlmResponse } from "../../shared/extract-json-from-llm-response";
import { buildExamAnalysisPrompt } from "./prompts/build-prompt";

export interface AnalyzeExamUploadDeps {
  llm: LlmPort;
  vectorSearch: VectorSearchPort;
}

export interface AnalyzeExamUploadInput {
  subject: string;
  questionResults: ExamQuestionResult[];
}

export interface AnalyzeExamUploadResult {
  unitAchievements: UnitAchievement[];
  weakUnits: UnitAchievement[];
  comment: string;
  sourceDocuments: string[];
}

function parseLlmComment(raw: string): string {
  const parsed = extractJsonFromLlmResponse(raw) as { comment?: unknown };
  if (typeof parsed.comment === "string" && parsed.comment.trim().length > 0) {
    return parsed.comment.trim();
  }
  throw new Error("LLM 응답을 파싱할 수 없습니다: comment 필드가 없습니다.");
}

export async function analyzeExamUpload(
  { llm, vectorSearch }: AnalyzeExamUploadDeps,
  { subject, questionResults }: AnalyzeExamUploadInput,
): Promise<AnalyzeExamUploadResult> {
  const unitAchievements = computeUnitAchievements(questionResults);
  const weakUnits = selectWeakUnits(unitAchievements);

  const retrievalQuery = `${subject} 성취기준 ${weakUnits.map((w) => w.unit).join(" ")}`.trim();
  const referenceMatches = await vectorSearch.search(retrievalQuery, 3);

  const raw = await llm.complete({
    prompt: buildExamAnalysisPrompt({ subject, achievements: unitAchievements, referenceMatches }),
  });

  const sourceDocuments = Array.from(new Set(referenceMatches.map((m) => m.documentTitle)));

  return {
    unitAchievements,
    weakUnits,
    comment: parseLlmComment(raw),
    sourceDocuments,
  };
}
