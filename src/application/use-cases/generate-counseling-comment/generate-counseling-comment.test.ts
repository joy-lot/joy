import { describe, expect, it } from "vitest";
import type { CounselingIntake } from "../../../domain/entities/counseling-intake";
import { FakeLlmAdapter } from "../../../../test/fakes/fake-llm-adapter";
import { FakeVectorSearchAdapter } from "../../../../test/fakes/fake-vector-search-adapter";
import { generateCounselingComment } from "./generate-counseling-comment";

const intake: CounselingIntake = {
  studentName: "김민준",
  grade: 2,
  className: "3",
  academicSummary: "수학 62점으로 지난 학기 대비 하락",
  relationshipSummary: "짝과 잦은 다툼(갈등)",
  careerSummary: "희망 진로: 소프트웨어 개발자",
};

describe("generateCounselingComment", () => {
  it("RAG 검색 결과를 프롬프트에 반영하고 학생용/학부모용 멘트와 근거 문서를 반환한다", async () => {
    const vectorSearch = new FakeVectorSearchAdapter([
      {
        documentId: "doc-1",
        documentTitle: "교우관계 상담 매뉴얼",
        content: "갈등 상황에서는 감정 표현을 돕고 중재자 역할을 제안한다.",
        score: 0.9,
      },
    ]);
    const llm = new FakeLlmAdapter([
      JSON.stringify({ comment: "민준아, 요즘 짝과의 관계가 힘들었지? 함께 방법을 찾아보자." }),
      JSON.stringify({ comment: "가정에서도 자녀의 교우관계에 관심을 가져주시면 좋겠습니다." }),
    ]);

    const result = await generateCounselingComment({ llm, vectorSearch }, { intake });

    expect(result.studentComment).toContain("민준아");
    expect(result.parentComment).toContain("가정에서도");
    expect(result.sourceDocuments).toEqual(["교우관계 상담 매뉴얼"]);

    expect(llm.receivedPrompts).toHaveLength(2);
    expect(llm.receivedPrompts[0]).toContain("교우관계 상담 매뉴얼");
    expect(vectorSearch.receivedQueries[0]).toContain("갈등");
  });

  it("근거 문서가 없으면 근거 없음을 프롬프트에 명시하고 빈 출처 목록을 반환한다", async () => {
    const vectorSearch = new FakeVectorSearchAdapter([]);
    const llm = new FakeLlmAdapter([
      JSON.stringify({ comment: "학생용 초안" }),
      JSON.stringify({ comment: "학부모용 초안" }),
    ]);

    const result = await generateCounselingComment({ llm, vectorSearch }, { intake });

    expect(result.sourceDocuments).toEqual([]);
    expect(llm.receivedPrompts[0]).toContain("찾지 못했습니다");
  });

  it("LLM 응답이 올바른 JSON 형식이 아니면 에러를 던진다", async () => {
    const vectorSearch = new FakeVectorSearchAdapter([]);
    const llm = new FakeLlmAdapter(["이건 JSON이 아닙니다", "이것도 아닙니다"]);

    await expect(
      generateCounselingComment({ llm, vectorSearch }, { intake }),
    ).rejects.toThrow(/파싱할 수 없습니다/);
  });
});
