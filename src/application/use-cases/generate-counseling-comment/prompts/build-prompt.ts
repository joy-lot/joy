import type { CounselingIntake } from "../../../../domain/entities/counseling-intake";
import type { DocumentChunkMatch } from "../../../../domain/ports/vector-search-port";
import type { CounselingAudience } from "../../../../domain/value-objects/counseling-audience";

function formatStudentContext(intake: CounselingIntake): string {
  return [
    `학생: ${intake.studentName} (${intake.grade}학년 ${intake.className}반)`,
    `학업성적: ${intake.academicSummary.trim() || "기록 없음"}`,
    `교우관계: ${intake.relationshipSummary.trim() || "기록 없음"}`,
    `진로: ${intake.careerSummary.trim() || "기록 없음"}`,
  ].join("\n");
}

function formatReferenceContext(matches: DocumentChunkMatch[]): string {
  if (matches.length === 0) {
    return "참고할 수 있는 학교 내부 문서를 찾지 못했습니다. 일반 상담 원칙에 따라 신중하게 작성하고, 근거 문서가 없다는 점을 명시하세요.";
  }

  return matches
    .map((m, i) => `[근거 ${i + 1}] (${m.documentTitle}) ${m.content}`)
    .join("\n");
}

const AUDIENCE_INSTRUCTION: Record<CounselingAudience, string> = {
  student:
    "학생 본인과 나누는 상담에 사용할 멘트를 작성하세요. 학생이 이해하기 쉬운 어조를 사용하되, 상담 전문 용어(예: 자기효능감, 또래관계, 정서적 지지 등)를 적절히 녹여 신뢰감을 주세요. 지나친 훈계나 단정적 표현은 피하세요.",
  parent:
    "학부모 상담에 사용할 멘트를 작성하세요. 객관적 근거를 바탕으로 전문적이고 정중한 어조를 사용하고, 가정에서의 협조 방안을 함께 제안하세요.",
};

export interface BuildCounselingPromptInput {
  intake: CounselingIntake;
  audience: CounselingAudience;
  referenceMatches: DocumentChunkMatch[];
}

export function buildCounselingPrompt({
  intake,
  audience,
  referenceMatches,
}: BuildCounselingPromptInput): string {
  return `당신은 학교 상담 전문가를 보조하는 AI입니다. 아래 학생 정보와 학교 내부 참고자료를 바탕으로 상담 멘트를 작성하세요.

## 학생 정보
${formatStudentContext(intake)}

## 참고자료 (근거)
${formatReferenceContext(referenceMatches)}

## 작성 지침
${AUDIENCE_INSTRUCTION[audience]}

## 출력 형식
다음 JSON 형식으로만 응답하세요. 다른 설명을 추가하지 마세요.
{"comment": "여기에 상담 멘트를 작성"}`;
}
