export type FragranceOption = {
  id: string;
  name: string;
  description: string;
  vibeTags: string[];
};

// 챗봇은 이 4개 중에서만 하나를 골라 추천합니다.
export const FRAGRANCE_OPTIONS: FragranceOption[] = [
  {
    id: "1",
    name: "라임바질만다린",
    description: "상큼한 라임과 만다린에 바질 잎의 싱그러운 허브향이 어우러진, 발랄하고 톡톡 튀는 시트러스 향",
    vibeTags: ["상큼한", "발랄한", "싱그러운", "여름 느낌"],
  },
  {
    id: "2",
    name: "화이트머스크",
    description: "포근하고 부드러운 머스크 향이 은은하게 감싸는, 깨끗하고 차분한 느낌의 향",
    vibeTags: ["포근한", "부드러운", "깨끗한", "차분한"],
  },
  {
    id: "3",
    name: "베이비파우더",
    description: "폭신폭신한 베이비파우더처럼 달콤하고 포근한, 어릴 적 추억을 떠올리게 하는 순수한 향",
    vibeTags: ["달콤한", "포근한", "몽글몽글한", "순수한"],
  },
  {
    id: "4",
    name: "우드세이지씨솔트",
    description: "바닷바람과 세이지, 젖은 나무 향이 어우러진 담백하고 시원한, 자연 그대로의 느낌을 주는 향",
    vibeTags: ["시원한", "자연적인", "담백한", "바다 느낌"],
  },
];
