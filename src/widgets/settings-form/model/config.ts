import type { UserPreferences } from "../../../entities/user-preferences";

type AiStyle = UserPreferences["aiStyle"];

export const taxiFeeOptions = [0, 5000, 10000, 20000, 100000];
export const walkLimitOptions = [5, 10, 15, 20];

export const aiStyleOptions: Array<{ id: AiStyle; label: string }> = [
  { id: "brief", label: "간결형" },
  { id: "detailed", label: "세부설명형" },
  { id: "emergency", label: "지각긴급형" },
];

export const publicDataSourceNotice = {
  heading: "실시간 데이터 출처",
  statusLabel: "2026 기준 가동",
  items: [
    { label: "실시간 버스위치 및 잔여석", source: "경기도 버스정보 GBIS open API" },
    { label: "지하철 혼잡도 가용범위", source: "서울 열린데이터광장 + 서울교통공사 빅데이터 통계" },
    { label: "따릉이 자전거 실시간 카운트", source: "서울 열린데이터광장 따릉이 대여" },
    { label: "지상구간 경로 가중치 계산", source: "OSM 네트워크 보행 기반 엔진" },
  ],
  disclaimer: "본 추정 결과물은 기상 및 도로 통제상 오차가 있을 수 있습니다.",
};
