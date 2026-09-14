import { describe, expect, it } from "vitest";
import { extractJsonFromLlmResponse } from "./extract-json-from-llm-response";

describe("extractJsonFromLlmResponse", () => {
  it("순수 JSON 문자열을 파싱한다", () => {
    expect(extractJsonFromLlmResponse('{"comment":"hi"}')).toEqual({ comment: "hi" });
  });

  it("```json 코드펜스로 감싸진 응답을 파싱한다", () => {
    const raw = '```json\n{"comment":"hi"}\n```';
    expect(extractJsonFromLlmResponse(raw)).toEqual({ comment: "hi" });
  });

  it("``` 코드펜스(언어 표기 없음)로 감싸진 응답을 파싱한다", () => {
    const raw = '```\n{"comment":"hi"}\n```';
    expect(extractJsonFromLlmResponse(raw)).toEqual({ comment: "hi" });
  });

  it("앞뒤에 설명 텍스트가 붙어도 JSON 블록을 추출한다", () => {
    const raw = '여기 결과입니다:\n{"comment":"hi"}\n감사합니다.';
    expect(extractJsonFromLlmResponse(raw)).toEqual({ comment: "hi" });
  });

  it("JSON을 찾을 수 없으면 에러를 던진다", () => {
    expect(() => extractJsonFromLlmResponse("이건 JSON이 아닙니다")).toThrow(
      /파싱할 수 없습니다/,
    );
  });
});
