import { detectRiskLevel, resolveRiskLevel } from "../../../domain/services/risk-detector";
import type { LlmPort } from "../../../domain/ports/llm-port";
import type { VectorSearchPort } from "../../../domain/ports/vector-search-port";
import type { ConcernCategory, RiskLevel } from "../../../domain/value-objects/risk-level";
import { extractJsonFromLlmResponse } from "../../shared/extract-json-from-llm-response";
import { buildCounselingLogPrompt } from "./prompts/build-prompt";

export interface AnalyzeCounselingLogDeps {
  llm: LlmPort;
  vectorSearch: VectorSearchPort;
}

export interface AnalyzeCounselingLogInput {
  ocrText: string;
}

export interface AnalyzeCounselingLogResult {
  concernCategory: ConcernCategory;
  riskLevel: RiskLevel;
  comment: string;
  sourceDocuments: string[];
  requiresEscalation: boolean;
  escalationMessage?: string;
}

const CONCERN_CATEGORIES: readonly ConcernCategory[] = [
  "학업",
  "교우관계",
  "가족",
  "진로",
  "정서",
  "기타",
];
const RISK_LEVELS: readonly RiskLevel[] = ["경", "중", "고"];

function isConcernCategory(value: unknown): value is ConcernCategory {
  return typeof value === "string" && (CONCERN_CATEGORIES as readonly string[]).includes(value);
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === "string" && (RISK_LEVELS as readonly string[]).includes(value);
}

interface ParsedLlmOutput {
  concernCategory: ConcernCategory;
  riskLevel: RiskLevel;
  comment: string;
}

function parseLlmOutput(raw: string): ParsedLlmOutput {
  const parsed = extractJsonFromLlmResponse(raw);
  const candidate = parsed as Record<string, unknown>;
  if (
    !isConcernCategory(candidate.concernCategory) ||
    !isRiskLevel(candidate.riskLevel) ||
    typeof candidate.comment !== "string" ||
    candidate.comment.trim().length === 0
  ) {
    throw new Error("LLM 응답을 파싱할 수 없습니다: 필수 필드가 누락되었습니다.");
  }

  return {
    concernCategory: candidate.concernCategory,
    riskLevel: candidate.riskLevel,
    comment: candidate.comment.trim(),
  };
}

const ESCALATION_MESSAGE =
  "위기 정황이 감지되었습니다. AI 초안과 별개로 전문기관(Wee센터, 정신건강복지센터 등) 연계 및 관리자 보고를 우선 검토하세요.";

export async function analyzeCounselingLog(
  { llm, vectorSearch }: AnalyzeCounselingLogDeps,
  { ocrText }: AnalyzeCounselingLogInput,
): Promise<AnalyzeCounselingLogResult> {
  const ruleBasedRisk = detectRiskLevel(ocrText);
  const referenceMatches = await vectorSearch.search(ocrText, 3);

  const raw = await llm.complete({
    prompt: buildCounselingLogPrompt({ ocrText, referenceMatches }),
  });
  const parsed = parseLlmOutput(raw);

  const finalRisk = resolveRiskLevel(ruleBasedRisk, parsed.riskLevel);
  const sourceDocuments = Array.from(new Set(referenceMatches.map((m) => m.documentTitle)));

  return {
    concernCategory: parsed.concernCategory,
    riskLevel: finalRisk,
    comment: parsed.comment,
    sourceDocuments,
    requiresEscalation: finalRisk === "고",
    escalationMessage: finalRisk === "고" ? ESCALATION_MESSAGE : undefined,
  };
}
