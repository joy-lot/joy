import type { LlmCompletionRequest, LlmPort } from "../../src/domain/ports/llm-port";

/**
 * 결정론적 Fake LLM 어댑터 (하네스 엔지니어링).
 * 실제 Ollama 서버 없이 유스케이스 오케스트레이션 로직을 검증하기 위해 사용한다.
 * 프롬프트에 포함된 키워드로 응답을 분기하거나, 고정 응답 큐를 순서대로 반환할 수 있다.
 */
export class FakeLlmAdapter implements LlmPort {
  public readonly receivedPrompts: string[] = [];
  private responseQueue: string[];

  constructor(responses: string[] = []) {
    this.responseQueue = [...responses];
  }

  async complete(request: LlmCompletionRequest): Promise<string> {
    this.receivedPrompts.push(request.prompt);
    const next = this.responseQueue.shift();
    if (next === undefined) {
      throw new Error(
        "FakeLlmAdapter: 준비된 응답이 부족합니다. 테스트에서 responses를 더 제공하세요.",
      );
    }
    return next;
  }
}
