export const boardingComparison = {
  currentBus: {
    label: "이번 차량 (1st Bus)",
    etaLabel: "3분 후 진입",
    seatStatus: "만석 (잔여 0석)",
    crowdStatus: "차내혼잡: 최고조",
  },
  nextBus: {
    label: "다음 차량 (2nd Bus)",
    etaLabel: "8분 후 진입",
    seatStatus: "원활 (잔여 13석)",
    crowdStatus: "좌석착정: 92% 보장",
  },
  confidenceLabel: "신뢰도: 패턴+실시간 융합",
  recommendationLabel: "다음 차량 착석 권고",
};

export const recoveryPlan = {
  title: "N버스 하이브리드 우회 (Plan A)",
  estimatedCostLabel: "12,600원 소요",
  description:
    "홍대에서 중랑구 외곽까지 심야 N62번을 이용해 최대한 기동 후, 마지막 4.2km 구간에 한해서만 최소 택시로 복귀합니다.",
  savingLabel: "₩24,000 절약",
  waitingHubAreaLabel: "홍대 부근 24시 안심 대기 거점 (첫차연계)",
  waitingHubs: [
    { name: "동교치방 안심쉼터", distanceLabel: "150m" },
    { name: "24시 무인 충전룸", distanceLabel: "320m" },
  ],
};
