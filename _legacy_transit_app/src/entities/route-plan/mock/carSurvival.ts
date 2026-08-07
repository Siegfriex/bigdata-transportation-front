export interface CarDetail {
  carNo: string;
  crowdPercent: number;
  transferStatus: "fast" | "normal" | "slow";
  comfortRating: "안전" | "주의" | "경고" | "공포";
  reason: string;
}

export function getCarSurvivalDetails(_line: string): CarDetail[] {
  return [
    { carNo: "1-1", crowdPercent: 65, transferStatus: "slow", comfortRating: "안전", reason: "상대적으로 출구와 멀어 한산하고 캐리어 휴대가 용이함" },
    { carNo: "2-2", crowdPercent: 110, transferStatus: "normal", comfortRating: "주의", reason: "적정 입석 분포를 유지하지만 손잡이 확보 가능" },
    { carNo: "3-3", crowdPercent: 55, transferStatus: "normal", comfortRating: "안전", reason: "주변 환승 벨트에서 이격되어 피로가 가장 적은 생존 구역 (추천)" },
    { carNo: "4-2", crowdPercent: 185, transferStatus: "fast", comfortRating: "공포", reason: "빠른 환승 승객의 비정상적 과밀 분포역, 하차 밀림 지옥 유발" },
    { carNo: "5-1", crowdPercent: 140, transferStatus: "normal", comfortRating: "경고", reason: "상당한 수준의 입석 밀도를 보이며 스마트폰 조작 불가능" },
    { carNo: "6-1", crowdPercent: 70, transferStatus: "normal", comfortRating: "안전", reason: "여유로운 공간으로 호흡 및 노트북 열람 가능 구역" },
  ];
}
