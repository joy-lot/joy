import type {
  DocumentChunkMatch,
  VectorSearchPort,
} from "../../src/domain/ports/vector-search-port";

/**
 * 결정론적 Fake 벡터 검색 어댑터.
 * RAG 검색 결과를 고정값으로 제공해 유스케이스가 근거 문서를 올바르게
 * 프롬프트/응답에 반영하는지 검증한다.
 */
export class FakeVectorSearchAdapter implements VectorSearchPort {
  public readonly receivedQueries: string[] = [];

  constructor(private readonly matches: DocumentChunkMatch[] = []) {}

  async search(query: string, topK: number): Promise<DocumentChunkMatch[]> {
    this.receivedQueries.push(query);
    return this.matches.slice(0, topK);
  }
}
