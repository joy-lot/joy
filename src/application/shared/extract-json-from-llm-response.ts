/**
 * LLM(특히 소형 모델)은 JSON만 응답하라는 지시에도 ```json 코드펜스로 감싸거나
 * 앞뒤에 설명 텍스트를 덧붙이는 경우가 많다. 실제 Qwen2.5 1.5b로 검증한 결과이며,
 * 이 함수는 그런 변형을 관용적으로 처리해 JSON을 최대한 복구한다.
 */
export function extractJsonFromLlmResponse(raw: string): unknown {
  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const braceMatch = candidate.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // fall through to error below
      }
    }
    throw new Error("LLM 응답에서 JSON을 파싱할 수 없습니다.");
  }
}
