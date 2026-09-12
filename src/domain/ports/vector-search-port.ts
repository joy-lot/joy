export interface DocumentChunkMatch {
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
}

export interface VectorSearchPort {
  search(query: string, topK: number): Promise<DocumentChunkMatch[]>;
}
