export interface DocumentChunkRecord {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
}

export interface DocumentChunkRepositoryPort {
  replaceChunksForDocument(documentId: string, chunks: DocumentChunkRecord[]): Promise<void>;
}
