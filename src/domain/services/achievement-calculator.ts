import type { AchievementLevel, UnitAchievement } from "../value-objects/achievement-level";

export interface ExamQuestionResult {
  unit: string;
  isCorrect: boolean;
}

function levelFromRatio(correctRatio: number): AchievementLevel {
  if (correctRatio >= 0.8) return "상";
  if (correctRatio >= 0.5) return "중";
  return "하";
}

/**
 * 단원별 정답/오답 결과로부터 성취수준(상/중/하)을 계산한다.
 * 순수 함수 — OCR/LLM 등 외부 의존성 없이 도메인 규칙만으로 테스트 가능.
 */
export function computeUnitAchievements(
  questionResults: ExamQuestionResult[],
): UnitAchievement[] {
  const byUnit = new Map<string, { correct: number; total: number }>();

  for (const q of questionResults) {
    const entry = byUnit.get(q.unit) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (q.isCorrect) entry.correct += 1;
    byUnit.set(q.unit, entry);
  }

  return Array.from(byUnit.entries()).map(([unit, { correct, total }]) => {
    const ratio = total === 0 ? 0 : correct / total;
    const level = levelFromRatio(ratio);
    return {
      unit,
      level,
      weaknessSummary:
        level !== "상" ? `${unit}: ${total}문항 중 ${correct}문항 정답 (${Math.round(ratio * 100)}%)` : undefined,
    };
  });
}

export function selectWeakUnits(achievements: UnitAchievement[]): UnitAchievement[] {
  return achievements.filter((a) => a.level !== "상");
}
