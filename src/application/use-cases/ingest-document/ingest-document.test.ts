import { describe, expect, it } from "vitest";
import { FakeDocumentChunkRepository } from "../../../../test/fakes/fake-document-chunk-repository";
import { FakeEmbeddingAdapter } from "../../../../test/fakes/fake-embedding-adapter";
import { ingestDocument } from "./ingest-document";

describe("ingestDocument", () => {
  it("문서를 청크로 분할하고 각 청크를 임베딩해 저장소에 저장한다", async () => {
    const embedding = new FakeEmbeddingAdapter();
    const chunkRepository = new FakeDocumentChunkRepository();

    const result = await ingestDocument(
      { embedding, chunkRepository },
      {
        documentId: "doc-1",
        documentTitle: "2026학년도 상담 매뉴얼",
        fullText: "a".repeat(1500),
      },
    );

    expect(result.chunkCount).toBeGreaterThan(1);
    expect(embedding.embeddedTexts).toHaveLength(result.chunkCount);

    const saved = chunkRepository.savedByDocumentId.get("doc-1");
    expect(saved).toBeDefined();
    expect(saved).toHaveLength(result.chunkCount);
    expect(saved?.every((c) => c.documentTitle === "2026학년도 상담 매뉴얼")).toBe(true);
    expect(saved?.every((c) => c.embedding.length > 0)).toBe(true);
  });

  it("재업로드 시 이전 청크를 새 청크로 교체한다(같은 documentId 재호출)", async () => {
    const embedding = new FakeEmbeddingAdapter();
    const chunkRepository = new FakeDocumentChunkRepository();

    await ingestDocument(
      { embedding, chunkRepository },
      { documentId: "doc-1", documentTitle: "v1", fullText: "짧은 문서" },
    );
    await ingestDocument(
      { embedding, chunkRepository },
      { documentId: "doc-1", documentTitle: "v2", fullText: "더 긴 새 문서 내용입니다" },
    );

    const saved = chunkRepository.savedByDocumentId.get("doc-1");
    expect(saved?.every((c) => c.documentTitle === "v2")).toBe(true);
  });
});
