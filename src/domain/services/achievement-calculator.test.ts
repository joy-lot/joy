import { describe, expect, it } from "vitest";
import { computeUnitAchievements, selectWeakUnits } from "./achievement-calculator";

describe("computeUnitAchievements", () => {
  it("정답률 80% 이상이면 상 수준으로 판정한다", () => {
    const result = computeUnitAchievements([
      { unit: "이차방정식", isCorrect: true },
      { unit: "이차방정식", isCorrect: true },
      { unit: "이차방정식", isCorrect: true },
      { unit: "이차방정식", isCorrect: true },
      { unit: "이차방정식", isCorrect: false },
    ]);
    expect(result).toEqual([{ unit: "이차방정식", level: "상", weaknessSummary: undefined }]);
  });

  it("정답률 50%~80% 미만이면 중 수준으로 판정하고 취약점 요약을 포함한다", () => {
    const [result] = computeUnitAchievements([
      { unit: "함수", isCorrect: true },
      { unit: "함수", isCorrect: false },
    ]);
    expect(result.level).toBe("중");
    expect(result.weaknessSummary).toContain("함수");
  });

  it("정답률 50% 미만이면 하 수준으로 판정한다", () => {
    const [result] = computeUnitAchievements([
      { unit: "도형", isCorrect: false },
      { unit: "도형", isCorrect: false },
      { unit: "도형", isCorrect: true },
    ]);
    expect(result.level).toBe("하");
  });

  it("여러 단원을 각각 집계한다", () => {
    const result = computeUnitAchievements([
      { unit: "A", isCorrect: true },
      { unit: "B", isCorrect: false },
    ]);
    expect(result.map((r) => r.unit)).toEqual(["A", "B"]);
  });
});

describe("selectWeakUnits", () => {
  it("상 수준이 아닌 단원만 선택한다", () => {
    const weak = selectWeakUnits([
      { unit: "A", level: "상" },
      { unit: "B", level: "중" },
      { unit: "C", level: "하" },
    ]);
    expect(weak.map((w) => w.unit)).toEqual(["B", "C"]);
  });
});
