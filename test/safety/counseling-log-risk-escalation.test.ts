import { describe, expect, it } from "vitest";
import { analyzeCounselingLog } from "../../src/application/use-cases/analyze-counseling-log/analyze-counseling-log";
import { FakeLlmAdapter } from "../fakes/fake-llm-adapter";
import { FakeVectorSearchAdapter } from "../fakes/fake-vector-search-adapter";

/**
 * 고위험 감지 회귀 하네스 (CLAUDE.md 3.4).
 * LLM이 위험 신호를 과소평가(경/중으로 오판)하더라도, 규칙 기반 키워드 필터가
 * 반드시 고위험으로 승격시키고 전문기관 연계 경고를 노출해야 한다.
 * 이 테스트는 회귀 시 빌드를 실패시키는 필수(critical) 테스트로 취급한다.
 */
describe("고위험 감지 회귀 하네스", () => {
  it("LLM이 위험도를 과소평가해도 고위험 키워드가 있으면 반드시 고위험으로 승격한다", async () => {
    const ocrText = "요즘 집에서 자꾸 혼나고 최근에는 자해 흔적도 보였다고 담임에게 이야기함";

    const vectorSearch = new FakeVectorSearchAdapter([]);
    const llm = new FakeLlmAdapter([
      JSON.stringify({
        concernCategory: "가족",
        riskLevel: "경",
        comment: "가정 내 갈등에 대한 일반적인 상담이 필요합니다.",
      }),
    ]);

    const result = await analyzeCounselingLog({ llm, vectorSearch }, { ocrText });

    expect(result.riskLevel).toBe("고");
    expect(result.requiresEscalation).toBe(true);
    expect(result.escalationMessage).toMatch(/전문기관/);
  });

  it("고위험 신호가 없고 LLM도 저위험으로 판단하면 정상적으로 경 위험도를 반환한다", async () => {
    const ocrText = "요즘 성적이 올라서 기분이 좋다고 이야기함";

    const vectorSearch = new FakeVectorSearchAdapter([]);
    const llm = new FakeLlmAdapter([
      JSON.stringify({
        concernCategory: "학업",
        riskLevel: "경",
        comment: "성취감을 격려하는 멘트를 제안합니다.",
      }),
    ]);

    const result = await analyzeCounselingLog({ llm, vectorSearch }, { ocrText });

    expect(result.riskLevel).toBe("경");
    expect(result.requiresEscalation).toBe(false);
    expect(result.escalationMessage).toBeUndefined();
  });

  it("LLM이 고위험으로 판단하면 규칙 기반 신호가 없어도 고위험을 유지한다", async () => {
    const ocrText = "표면적으로는 특이사항이 없어 보이나 상담 중 위화감을 느낌";

    const vectorSearch = new FakeVectorSearchAdapter([]);
    const llm = new FakeLlmAdapter([
      JSON.stringify({
        concernCategory: "정서",
        riskLevel: "고",
        comment: "즉각적인 추가 관찰이 필요합니다.",
      }),
    ]);

    const result = await analyzeCounselingLog({ llm, vectorSearch }, { ocrText });

    expect(result.riskLevel).toBe("고");
    expect(result.requiresEscalation).toBe(true);
  });
});
