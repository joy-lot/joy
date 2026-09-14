import type { DocumentChunkMatch } from "../../../../domain/ports/vector-search-port";
import type { UnitAchievement } from "../../../../domain/value-objects/achievement-level";

function formatReferenceContext(matches: DocumentChunkMatch[]): string {
  if (matches.length === 0) {
    return "참고할 수 있는 교과 성취기준/평가 루브릭 문서를 찾지 못했습니다. 일반 교수학습 원칙에 따라 신중하게 작성하고, 근거 문서가 없다는 점을 명시하세요.";
  }
  return matches
    .map((m, i) => `[근거 ${i + 1}] (${m.documentTitle}) ${m.content}`)
    .join("\n");
}

function formatAchievements(achievements: UnitAchievement[]): string {
  return achievements
    .map((a) => `- ${a.unit}: ${a.level}${a.weaknessSummary ? ` (${a.weaknessSummary})` : ""}`)
    .join("\n");
}

export interface BuildExamAnalysisPromptInput {
  subject: string;
  achievements: UnitAchievement[];
  referenceMatches: DocumentChunkMatch[];
}

export function buildExamAnalysisPrompt({
  subject,
  achievements,
  referenceMatches,
}: BuildExamAnalysisPromptInput): string {
  return `당신은 학교 교과 상담을 보조하는 AI입니다. 아래는 "${subject}" 과목 시험지를 채점하여 계산한 단원별 성취수준입니다.

## 단원별 성취수준
${formatAchievements(achievements)}

## 참고자료 (교과 성취기준/평가 루브릭)
${formatReferenceContext(referenceMatches)}

## 작성 지침
취약한 단원(중/하 수준)을 중심으로 구체적인 학습 전략과 성적 향상 방향을 상담 멘트로 작성하세요. 막연한 조언 대신 단원명을 언급하며 실행 가능한 제안을 하세요.

## 출력 형식
반드시 한국어로만 작성하세요. 다음 JSON 형식으로만 응답하고, 코드블록이나 다른 설명을 추가하지 마세요.
{"comment": "한국어로 작성한 성적 향상 방향 상담 멘트"}`;
}
