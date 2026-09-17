export type FragranceOption = {
  id: string;
  name: string;
  description: string;
  vibeTags: string[];
};

// TODO: 실제 부스에서 쓸 향 4가지가 정해지면 name/description/vibeTags만 채워 넣으면 됩니다.
// 챗봇은 이 4개 중에서만 하나를 골라 추천합니다.
export const FRAGRANCE_OPTIONS: FragranceOption[] = [
  {
    id: "1",
    name: "향 1 (이름 미정)",
    description: "이 향의 느낌을 설명해주세요 (예: 상큼하고 청량한 시트러스 느낌)",
    vibeTags: ["느낌 키워드 1", "느낌 키워드 2"],
  },
  {
    id: "2",
    name: "향 2 (이름 미정)",
    description: "이 향의 느낌을 설명해주세요",
    vibeTags: ["느낌 키워드 1", "느낌 키워드 2"],
  },
  {
    id: "3",
    name: "향 3 (이름 미정)",
    description: "이 향의 느낌을 설명해주세요",
    vibeTags: ["느낌 키워드 1", "느낌 키워드 2"],
  },
  {
    id: "4",
    name: "향 4 (이름 미정)",
    description: "이 향의 느낌을 설명해주세요",
    vibeTags: ["느낌 키워드 1", "느낌 키워드 2"],
  },
];
