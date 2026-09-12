import type { RiskLevel } from "../value-objects/risk-level";

const HIGH_RISK_KEYWORDS = [
  "자살",
  "자해",
  "죽고 싶",
  "죽고싶",
  "학대",
  "방임",
  "가정폭력",
  "폭행",
  "성폭력",
] as const;

const MEDIUM_RISK_KEYWORDS = [
  "왕따",
  "괴롭힘",
  "따돌림",
  "우울",
  "불안 발작",
  "가출",
] as const;

/**
 * 규칙 기반 위험도 판정. LLM 판단과 병행(hybrid)하여 고위험 신호 누락을 방지하기 위한
 * 안전장치이므로, 텍스트에 고위험 키워드가 하나라도 포함되면 무조건 "고"를 반환한다.
 */
export function detectRiskLevel(text: string): RiskLevel {
  const normalized = text.normalize("NFKC");

  if (HIGH_RISK_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "고";
  }

  if (MEDIUM_RISK_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "중";
  }

  return "경";
}

/**
 * 규칙 기반 판정과 LLM 판정 중 더 높은 위험도를 채택한다(과소평가 방지).
 */
export function resolveRiskLevel(ruleBasedLevel: RiskLevel, llmLevel: RiskLevel): RiskLevel {
  const order: Record<RiskLevel, number> = { 경: 0, 중: 1, 고: 2 };
  return order[ruleBasedLevel] >= order[llmLevel] ? ruleBasedLevel : llmLevel;
}
