import { describe, expect, it } from "vitest";
import { FakeLlmAdapter } from "../../../../test/fakes/fake-llm-adapter";
import { FakeVectorSearchAdapter } from "../../../../test/fakes/fake-vector-search-adapter";
import { analyzeExamUpload } from "./analyze-exam-upload";

describe("analyzeExamUpload", () => {
  it("단원별 성취수준을 계산하고 취약 단원 기반 향상 방향 멘트를 생성한다", async () => {
    const vectorSearch = new FakeVectorSearchAdapter([
      {
        documentId: "doc-1",
        documentTitle: "수학과 성취기준",
        content: "이차방정식 단원은 인수분해와 근의 공식을 반복 연습해야 한다.",
        score: 0.85,
      },
    ]);
    const llm = new FakeLlmAdapter([
      JSON.stringify({ comment: "이차방정식 단원의 인수분해 연습이 필요합니다." }),
    ]);

    const result = await analyzeExamUpload(
      { llm, vectorSearch },
      {
        subject: "수학",
        questionResults: [
          { unit: "이차방정식", isCorrect: false },
          { unit: "이차방정식", isCorrect: false },
          { unit: "이차방정식", isCorrect: true },
          { unit: "도형", isCorrect: true },
          { unit: "도형", isCorrect: true },
        ],
      },
    );

    expect(result.unitAchievements).toHaveLength(2);
    expect(result.weakUnits.map((w) => w.unit)).toEqual(["이차방정식"]);
    expect(result.comment).toContain("이차방정식");
    expect(result.sourceDocuments).toEqual(["수학과 성취기준"]);
    expect(vectorSearch.receivedQueries[0]).toContain("이차방정식");
  });

  it("LLM 응답이 JSON이 아니면 에러를 던진다", async () => {
    const vectorSearch = new FakeVectorSearchAdapter([]);
    const llm = new FakeLlmAdapter(["형식에 맞지 않는 응답"]);

    await expect(
      analyzeExamUpload(
        { llm, vectorSearch },
        { subject: "수학", questionResults: [{ unit: "함수", isCorrect: true }] },
      ),
    ).rejects.toThrow(/파싱할 수 없습니다/);
  });
});
