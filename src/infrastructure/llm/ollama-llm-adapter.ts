import type { LlmCompletionRequest, LlmPort } from "../../domain/ports/llm-port";

export interface OllamaLlmAdapterConfig {
  baseUrl: string;
  model: string;
}

/**
 * LlmPort의 실제 구현체. 로컬 Ollama 서버(Qwen 모델)와 HTTP로 통신한다.
 * domain/application 계층은 이 클래스를 알지 못하며, port 인터페이스로만 의존한다.
 */
export class OllamaLlmAdapter implements LlmPort {
  constructor(private readonly config: OllamaLlmAdapterConfig) {}

  async complete({ prompt, temperature }: LlmCompletionRequest): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        stream: false,
        ...(temperature !== undefined ? { options: { temperature } } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama 요청에 실패했습니다 (${response.status} ${response.statusText}). ` +
          "OLLAMA_BASE_URL 설정과 Ollama 서버 실행 상태를 확인하세요.",
      );
    }

    const data = (await response.json()) as { response?: unknown };
    if (typeof data.response !== "string") {
      throw new Error("Ollama 응답 형식이 예상과 다릅니다 (response 필드 없음).");
    }
    return data.response;
  }
}
