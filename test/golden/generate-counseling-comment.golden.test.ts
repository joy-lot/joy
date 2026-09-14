import { describe, it } from "vitest";
import { generateCounselingComment } from "../../src/application/use-cases/generate-counseling-comment/generate-counseling-comment";
import { OllamaLlmAdapter } from "../../src/infrastructure/llm/ollama-llm-adapter";
import { FakeVectorSearchAdapter } from "../fakes/fake-vector-search-adapter";
import scenario from "./scenarios/counseling-comment.scenario.json" with { type: "json" };

const shouldRun = process.env.RUN_GOLDEN === "1";

describe.skipIf(!shouldRun)("골든 데이터셋: generateCounselingComment (실제 Ollama 호출)", () => {
  it(`시나리오 "${scenario.name}"의 출력을 콘솔에 출력한다 (사람이 리뷰)`, async () => {
    const llm = new OllamaLlmAdapter({
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      model: process.env.OLLAMA_MODEL ?? "qwen2.5:1.5b",
    });
    // RAG 검색 결과는 고정해 LLM 자체의 변화만 관찰한다.
    const vectorSearch = new FakeVectorSearchAdapter([]);

    const result = await generateCounselingComment({ llm, vectorSearch }, { intake: scenario.intake });

    // 자동 assert 대신 결과를 출력해 사람이 diff를 리뷰한다 (README.md 참고).
    console.log(JSON.stringify(result, null, 2));
  });
});
