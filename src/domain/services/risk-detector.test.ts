import { describe, expect, it } from "vitest";
import { detectRiskLevel, resolveRiskLevel } from "./risk-detector";

describe("detectRiskLevel", () => {
  it("고위험 키워드가 포함되면 고 위험도를 반환한다", () => {
    expect(detectRiskLevel("요즘 자꾸 죽고 싶다는 말을 해요")).toBe("고");
    expect(detectRiskLevel("가정에서 학대 정황이 의심됩니다")).toBe("고");
  });

  it("중위험 키워드가 포함되면 중 위험도를 반환한다", () => {
    expect(detectRiskLevel("반에서 따돌림을 당하는 것 같아요")).toBe("중");
  });

  it("특이 키워드가 없으면 경 위험도를 반환한다", () => {
    expect(detectRiskLevel("요즘 친구들과 잘 지내고 성적도 올랐어요")).toBe("경");
  });

  it("고위험 키워드가 다른 키워드와 함께 있어도 고위험을 우선한다", () => {
    expect(
      detectRiskLevel("따돌림을 당하다가 최근에는 자해 흔적도 발견되었습니다"),
    ).toBe("고");
  });
});

describe("resolveRiskLevel", () => {
  it("규칙 기반과 LLM 판정 중 더 높은 위험도를 채택한다", () => {
    expect(resolveRiskLevel("경", "고")).toBe("고");
    expect(resolveRiskLevel("고", "경")).toBe("고");
    expect(resolveRiskLevel("중", "경")).toBe("중");
    expect(resolveRiskLevel("경", "경")).toBe("경");
  });
});
