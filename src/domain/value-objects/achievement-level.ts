export type AchievementLevel = "상" | "중" | "하";

export interface UnitAchievement {
  unit: string;
  level: AchievementLevel;
  weaknessSummary?: string;
}
