import { describe, expect, it } from "vitest";
import { OllamaEmbeddingAdapter } from "../../src/infrastructure/llm/ollama-embedding-adapter";
import { getSupabaseServiceClient } from "../../src/infrastructure/persistence/supabase-client";
import { SupabaseVectorSearchAdapter } from "../../src/infrastructure/rag/supabase-vector-search-adapter";
import queries from "./queries.json" with { type: "json" };

const shouldRun = process.env.RUN_RAG_EVAL === "1";

describe.skipIf(!shouldRun)("RAG 검색 품질 하네스 (실제 Supabase 호출)", () => {
  it("각 질의의 top-3 결과에 기대 문서가 포함되어야 한다(recall)", async () => {
    const embedding = new OllamaEmbeddingAdapter({
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      model: process.env.OLLAMA_EMBEDDING_MODEL ?? "qwen2.5:2b",
    });
    const vectorSearch = new SupabaseVectorSearchAdapter(getSupabaseServiceClient(), embedding);

    const misses: string[] = [];
    for (const { query, expectedDocumentTitle } of queries) {
      const matches = await vectorSearch.search(query, 3);
      const found = matches.some((m) => m.documentTitle === expectedDocumentTitle);
      if (!found) misses.push(`"${query}" → 기대: ${expectedDocumentTitle}`);
    }

    expect(misses, `recall 실패 질의:\n${misses.join("\n")}`).toEqual([]);
  });
});
