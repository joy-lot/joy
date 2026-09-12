import { describe, expect, it } from "vitest";
import { chunkText } from "./text-chunker";

describe("chunkText", () => {
  it("빈 문자열은 빈 배열을 반환한다", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("chunkSize보다 짧은 텍스트는 하나의 청크로 반환한다", () => {
    expect(chunkText("짧은 문서 내용", { chunkSize: 700, overlap: 100 })).toEqual([
      "짧은 문서 내용",
    ]);
  });

  it("긴 텍스트를 오버랩을 포함해 여러 청크로 분할한다", () => {
    const text = "a".repeat(1000);
    const chunks = chunkText(text, { chunkSize: 400, overlap: 100 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toHaveLength(400);
    // 두 번째 청크는 첫 번째 청크의 마지막 100자와 겹쳐 시작한다.
    expect(chunks[1].slice(0, 100)).toBe(chunks[0].slice(-100));
  });

  it("overlap이 chunkSize 이상이면 에러를 던진다", () => {
    expect(() => chunkText("내용", { chunkSize: 100, overlap: 100 })).toThrow();
  });
});
