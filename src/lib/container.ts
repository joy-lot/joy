import { OllamaEmbeddingAdapter } from "../infrastructure/llm/ollama-embedding-adapter";
import { OllamaLlmAdapter } from "../infrastructure/llm/ollama-llm-adapter";
import { getSupabaseServiceClient } from "../infrastructure/persistence/supabase-client";
import { SupabaseVectorSearchAdapter } from "../infrastructure/rag/supabase-vector-search-adapter";
import { env } from "./env";

/**
 * 조립 지점(Composition Root). Next.js 서버 액션/라우트 핸들러에서
 * use-case를 호출하기 전에 여기서 port 구현체를 생성해 주입한다.
 * domain/application 계층은 이 파일의 존재를 알지 못한다.
 */
export function createLlmPort() {
  return new OllamaLlmAdapter({ baseUrl: env.ollamaBaseUrl, model: env.ollamaModel });
}

export function createEmbeddingPort() {
  return new OllamaEmbeddingAdapter({
    baseUrl: env.ollamaBaseUrl,
    model: env.ollamaEmbeddingModel,
  });
}

export function createVectorSearchPort() {
  return new SupabaseVectorSearchAdapter(getSupabaseServiceClient(), createEmbeddingPort());
}
