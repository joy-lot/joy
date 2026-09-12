import type {
  DocumentChunkRecord,
  DocumentChunkRepositoryPort,
} from "../../src/domain/ports/document-chunk-repository-port";

export class FakeDocumentChunkRepository implements DocumentChunkRepositoryPort {
  public readonly savedByDocumentId = new Map<string, DocumentChunkRecord[]>();

  async replaceChunksForDocument(
    documentId: string,
    chunks: DocumentChunkRecord[],
  ): Promise<void> {
    this.savedByDocumentId.set(documentId, chunks);
  }
}
