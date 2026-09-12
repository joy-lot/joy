import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmbeddingPort } from "../../domain/ports/embedding-port";
import type {
  DocumentChunkMatch,
  VectorSearchPort,
} from "../../domain/ports/vector-search-port";

interface MatchDocumentChunksRow {
  document_id: string;
  document_title: string;
  content: string;
  similarity: number;
}

/**
 * VectorSearchPort의 실제 구현체. Supabase pgvector에 저장된 document_chunks를
 * 코사인 유사도로 검색하는 RPC 함수 `match_document_chunks`를 호출한다.
 * (RPC 정의는 supabase/schema.sql 참고)
 */
export class SupabaseVectorSearchAdapter implements VectorSearchPort {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly embedding: EmbeddingPort,
  ) {}

  async search(query: string, topK: number): Promise<DocumentChunkMatch[]> {
    const queryEmbedding = await this.embedding.embed(query);

    const { data, error } = await this.supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: topK,
    });

    if (error) {
      throw new Error(`RAG 검색에 실패했습니다: ${error.message}`);
    }

    return ((data ?? []) as MatchDocumentChunksRow[]).map((row) => ({
      documentId: row.document_id,
      documentTitle: row.document_title,
      content: row.content,
      score: row.similarity,
    }));
  }
}
