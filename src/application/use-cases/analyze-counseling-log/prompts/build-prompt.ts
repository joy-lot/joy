import type { DocumentChunkMatch } from "../../../../domain/ports/vector-search-port";

function formatReferenceContext(matches: DocumentChunkMatch[]): string {
  if (matches.length === 0) {
    return "참고할 수 있는 학교 내부 문서를 찾지 못했습니다. 일반 상담 원칙에 따라 신중하게 작성하고, 근거 문서가 없다는 점을 명시하세요.";
  }
  return matches
    .map((m, i) => `[근거 ${i + 1}] (${m.documentTitle}) ${m.content}`)
    .join("\n");
}

export interface BuildCounselingLogPromptInput {
  ocrText: string;
  referenceMatches: DocumentChunkMatch[];
}

export function buildCounselingLogPrompt({
  ocrText,
  referenceMatches,
}: BuildCounselingLogPromptInput): string {
  return `당신은 학교 상담 전문가를 보조하는 AI입니다. 아래는 상담일지를 OCR로 추출한 텍스트입니다.

## 상담일지 내용
${ocrText}

## 참고자료 (근거)
${formatReferenceContext(referenceMatches)}

## 작성 지침
1. 학생의 고민 주제를 다음 중 하나로 분류하세요: 학업, 교우관계, 가족, 진로, 정서, 기타.
2. 위험도를 다음 중 하나로 판단하세요: 경(일상적 고민), 중(지속 관찰 필요), 고(즉각적 개입/전문기관 연계 필요 — 자해·학대·폭력 등 위기 정황이 있는 경우).
3. 고민을 해결할 수 있는 방향의 상담 멘트를 작성하세요. 근거자료가 있다면 이를 반영하세요.

## 출력 형식
다음 JSON 형식으로만 응답하세요.
{"concernCategory": "학업|교우관계|가족|진로|정서|기타", "riskLevel": "경|중|고", "comment": "상담 멘트"}`;
}
