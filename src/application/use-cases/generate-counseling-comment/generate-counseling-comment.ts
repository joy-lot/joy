import type { CounselingIntake } from "../../../domain/entities/counseling-intake";
import type { LlmPort } from "../../../domain/ports/llm-port";
import type { VectorSearchPort } from "../../../domain/ports/vector-search-port";
import { extractJsonFromLlmResponse } from "../../shared/extract-json-from-llm-response";
import { buildCounselingPrompt } from "./prompts/build-prompt";

export interface GenerateCounselingCommentDeps {
  llm: LlmPort;
  vectorSearch: VectorSearchPort;
}

export interface GenerateCounselingCommentInput {
  intake: CounselingIntake;
}

export interface GenerateCounselingCommentResult {
  studentComment: string;
  parentComment: string;
  sourceDocuments: string[];
}

function buildRetrievalQuery(intake: CounselingIntake): string {
  const parts = [
    "학생 상담",
    intake.relationshipSummary,
    intake.careerSummary,
  ].filter((v): v is string => Boolean(v && v.trim().length > 0));
  return parts.join(" ");
}

function parseLlmComment(raw: string): string {
  const parsed = extractJsonFromLlmResponse(raw) as { comment?: unknown };
  if (typeof parsed.comment === "string" && parsed.comment.trim().length > 0) {
    return parsed.comment.trim();
  }
  throw new Error("LLM 응답을 파싱할 수 없습니다: comment 필드가 없습니다.");
}

export async function generateCounselingComment(
  { llm, vectorSearch }: GenerateCounselingCommentDeps,
  { intake }: GenerateCounselingCommentInput,
): Promise<GenerateCounselingCommentResult> {
  const retrievalQuery = buildRetrievalQuery(intake);
  const referenceMatches = await vectorSearch.search(retrievalQuery, 3);

  const [studentRaw, parentRaw] = await Promise.all([
    llm.complete({
      prompt: buildCounselingPrompt({ intake, audience: "student", referenceMatches }),
    }),
    llm.complete({
      prompt: buildCounselingPrompt({ intake, audience: "parent", referenceMatches }),
    }),
  ]);

  const sourceDocuments = Array.from(
    new Set(referenceMatches.map((m) => m.documentTitle)),
  );

  return {
    studentComment: parseLlmComment(studentRaw),
    parentComment: parseLlmComment(parentRaw),
    sourceDocuments,
  };
}
