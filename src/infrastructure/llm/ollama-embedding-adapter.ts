import type { EmbeddingPort } from "../../domain/ports/embedding-port";

export interface OllamaEmbeddingConfig {
  baseUrl: string;
  model: string;
}

/**
 * EmbeddingPort의 실제 구현체. Ollama의 임베딩 엔드포인트로 텍스트를 벡터로 변환한다.
 * RAG 색인(ingest-document)과 검색(vector-search) 양쪽에서 재사용한다.
 */
export class OllamaEmbeddingAdapter implements EmbeddingPort {
  constructor(private readonly config: OllamaEmbeddingConfig) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.config.model, prompt: text }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama 임베딩 요청에 실패했습니다 (${response.status} ${response.statusText}).`,
      );
    }

    const data = (await response.json()) as { embedding?: unknown };
    if (!Array.isArray(data.embedding)) {
      throw new Error("Ollama 임베딩 응답 형식이 예상과 다릅니다 (embedding 필드 없음).");
    }
    return data.embedding as number[];
  }
}
