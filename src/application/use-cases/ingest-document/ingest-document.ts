import type { DocumentChunkRepositoryPort } from "../../../domain/ports/document-chunk-repository-port";
import type { EmbeddingPort } from "../../../domain/ports/embedding-port";
import { chunkText } from "../../../domain/services/text-chunker";

export interface IngestDocumentDeps {
  embedding: EmbeddingPort;
  chunkRepository: DocumentChunkRepositoryPort;
}

export interface IngestDocumentInput {
  documentId: string;
  documentTitle: string;
  fullText: string;
}

export interface IngestDocumentResult {
  chunkCount: number;
}

/**
 * 참고 문서를 청크 분할 → 임베딩 → 저장하는 RAG 색인 유스케이스.
 * 문서 재업로드 시에도 그대로 호출하면 되며, 저장소 구현체가 기존 청크를 교체한다.
 */
export async function ingestDocument(
  { embedding, chunkRepository }: IngestDocumentDeps,
  { documentId, documentTitle, fullText }: IngestDocumentInput,
): Promise<IngestDocumentResult> {
  const chunks = chunkText(fullText);

  const records = await Promise.all(
    chunks.map(async (content, chunkIndex) => ({
      documentId,
      documentTitle,
      chunkIndex,
      content,
      embedding: await embedding.embed(content),
    })),
  );

  await chunkRepository.replaceChunksForDocument(documentId, records);

  return { chunkCount: records.length };
}
