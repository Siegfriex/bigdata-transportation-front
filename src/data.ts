import { RoutePlan, SavedReport, UserPreferences } from "./types";

export function getDefaultPreferences(): UserPreferences {
  return {
    home: "염창역",
    work: "여의도역",
    crowdSensitivity: "normal",
    maxTaxiFee: 10000,
    walkLimitMin: 15,
    useBike: true,
    aiStyle: "detailed",
    favoriteRoutes: ["염창역 → 여의도역", "사당역 → 강남역"]
  };
}

export function getSavedReportsMock(): SavedReport[] {
  return [
    {
      id: "rep-01",
      date: "2026-05-26",
      type: "deadline",
      from: "염창역",
      to: "여의도역",
      status: "success",
      summary: "9시 마감 출근: 택시 + 급행 결합으로 08:57 세이프 도착성공",
      cost: 8000
    },
    {
      id: "rep-02",
      date: "2026-05-25",
      type: "carriage",
      from: "염창역",
      to: "여의도역",
      status: "success",
      summary: "9호선 급행 3-3번 생존 칸 탑승: 입석 혼잡압력 40% 감축 해결",
      cost: 1400
    },
    {
      id: "rep-03",
      date: "2026-05-24",
      type: "recovery",
      from: "홍대입구역",
      to: "남양주시",
      status: "warning",
      summary: "심야 귀가: N버스 + 단거리 택시 분할 전술로 택시비 24,000원 대폭 절약",
      cost: 9800
    }
  ];
}

export function getRoutePlans(start: string, end: string, opts: { useBike: boolean; maxTaxiFee: number }): RoutePlan[] {
  const plans: RoutePlan[] = [];

  // Scenario 1: 염창역 -> 여의도역 (Default Carriage Survival & Deadline)
  if (start === "염창역" && end === "여의도역") {
    plans.push({
      id: "plan_a",
      name: "추천: 급행 지하철 안심 결합 (생존 카)",
      modes: ["subway", "walk"],
      eta: "08:57",
      extraCost: 1400,
      risk: "medium",
      crowd: "crowded", // but lower on recommended cars!
      confidence: "realtime",
      description: "인파가 극심한 빠른 환승 칸 대신 3-3번, 6-1번 생존 칸을 선택하여 어깨 결림 압박을 피합니다.",
      timeline: [
        { mode: "walk", detail: "염창역 승강장 이동 (3-3 위치 대기)", duration: 3 },
        { mode: "subway", detail: "9호선 급행 탑승 (여의도행)", duration: 8, cost: 1400 },
        { mode: "walk", detail: "여의도역 3번 출구 도보이동", duration: 6 }
      ]
    });

    plans.push({
      id: "plan_b",
      name: "비용최소: 따릉이 전술 우회",
      modes: ["bike", "walk"],
      eta: "08:59",
      extraCost: 1000,
      risk: "high",
      crowd: "empty",
      confidence: "estimated",
      description: "한강 자전거 도로를 따라 기동성 있게 이동하여 입석 피로를 0%로 줄입니다. (마감 타이트)",
      timeline: [
        { mode: "bike", detail: "염창역 따릉이 대여 후 자전거 탐방로 이동", duration: 18, cost: 1000 },
        { mode: "walk", detail: "대여소 반납 후 여의도 도보", duration: 7 }
      ]
    });

    plans.push({
      id: "plan_c",
      name: "안정: 택시 선탑승 우회 구간",
      modes: ["taxi", "subway", "walk"],
      eta: "08:53",
      extraCost: 8500,
      risk: "low",
      crowd: "normal",
      confidence: "realtime",
      description: "올림픽대로 초기 정체 구간을 택시로 소폭 우회하여 당산역 환승으로 안착합니다.",
      timeline: [
        { mode: "taxi", detail: "염창역 부근 택시 이용 (당산역까지)", duration: 7, cost: 7100 },
        { mode: "subway", detail: "2호선 환승 후 당산 -> 여의도", duration: 5, cost: 1400 },
        { mode: "walk", detail: "여의도 사무실 도착", duration: 3 }
      ]
    });
  } 
  
  // Scenario 2: 사당역 -> 강남역 (Bus Boarding Possibility)
  else if (start === "사당역" && end === "강남역") {
    plans.push({
      id: "plan_a",
      name: "추천: 지하철 2호선 우회 수평 이동",
      modes: ["subway", "walk"],
      eta: "18:25",
      extraCost: 1400,
      risk: "low",
      crowd: "very_crowded",
      confidence: "pattern",
      description: "만차인 광역버스를 억지로 타는 대신, 교대 통제를 우회하여 2호선 수송력에 기대 안전한 안착을 돕습니다.",
      timeline: [
        { mode: "walk", detail: "사당역 2호선 승강장 진입", duration: 4 },
        { mode: "subway", detail: "2호선 외선순환 (강남행)", duration: 12, cost: 1400 },
        { mode: "walk", detail: "강남역 하차 및 퇴근지 연결", duration: 4 }
      ]
    });

    plans.push({
      id: "plan_b",
      name: "대기: 버스 8100번 다음 차 대치",
      modes: ["bus", "walk"],
      eta: "18:32",
      extraCost: 2800,
      risk: "medium",
      crowd: "normal",
      confidence: "realtime",
      description: "현재 다가오는 만차 버스 대신 8분 뒤 진입하는 다음 버스를 대기하여 좌석 안착률을 90% 이상 확보합니다.",
      timeline: [
        { mode: "walk", detail: "사당역 광역버스 승강장 대치", duration: 8 },
        { mode: "bus", detail: "광역버스 8100번 다음차 좌석 탑승", duration: 15, cost: 2800 },
        { mode: "walk", detail: "정류소 하차 후 도보", duration: 4 }
      ]
    });
  } 
  
  // Scenario 3: 홍대입구역 -> 남양주시 (Late Night Recovery)
  else if (start === "홍대입구역" && end === "남양주시") {
    plans.push({
      id: "plan_a",
      name: "추천: 심야 N버스 + 외곽 택시 분할 복구",
      modes: ["bus", "taxi"],
      eta: "01:28",
      extraCost: 12600,
      risk: "medium",
      crowd: "normal",
      confidence: "estimated",
      description: "전구간 택시 요금(약 36,000원) 대비 심야 N버스를 중랑구까지 탑승 후, 차액 택시를 연계해 지각비용을 극단적으로 방어합니다.",
      timeline: [
        { mode: "bus", detail: "홍대입구역 N62 심야 버스 승차 (동대문/중랑 방향)", duration: 38, cost: 2800 },
        { mode: "taxi", detail: "중랑외곽 지점 하차 후 단거리 택시 결합", duration: 15, cost: 9800 }
      ]
    });

    plans.push({
      id: "plan_b",
      name: "심야 생존: 24h 안심쉘터 + 첫차 연계 대치",
      modes: ["walk"],
      eta: "05:40",
      extraCost: 0,
      risk: "low",
      crowd: "empty",
      confidence: "pattern",
      description: "택시를 전혀 탈 수 없을 시, 홍대 부근 24시 대기 충전 거점(도보 2분)에서 안심 휴식 후 5시 첫차로 즉각 복귀합니다.",
      timeline: [
        { mode: "walk", detail: "홍대역 5번출구 앞 24시 안심 거점 이동 및 충전", duration: 240 },
        { mode: "walk", detail: "첫차 시간 연계 경의중앙선 탑승이동", duration: 45 }
      ]
    });
  }

  // General scenario fallback dynamic generator (e.g. customized user routing)
  if (plans.length === 0) {
    plans.push({
      id: "dyn_a",
      name: `추천: ${start} → ${end} 최적 해법 (대중교통 주도)`,
      modes: ["subway", "walk"],
      eta: "08:58",
      extraCost: 1400,
      risk: "medium",
      crowd: "normal",
      confidence: "estimated",
      description: "실시간 대중교통 배차 간격을 분석하여 환승 구간 정체를 우회합니다.",
      timeline: [
        { mode: "walk", detail: `${start}역 이동`, duration: 5 },
        { mode: "subway", detail: "가까운 급행 지하철 탑승", duration: 15, cost: 1400 },
        { mode: "walk", detail: `${end} 목적지 도보`, duration: 5 }
      ]
    });

    if (opts.useBike) {
      plans.push({
        id: "dyn_b",
        name: "우회: 따릉이 자전거 연계",
        modes: ["bike", "walk"],
        eta: "09:04",
        extraCost: 1000,
        risk: "high",
        crowd: "empty",
        confidence: "pattern",
        description: "교통정체를 완전히 극복할 수 있도록 공공자전거 도로망에 합류합니다.",
        timeline: [
          { mode: "bike", detail: "근거리 따릉이 대여 및 주행", duration: 20, cost: 1000 },
          { mode: "walk", detail: `${end} 반납 후 최종 도보 안착`, duration: 6 }
        ]
      });
    }

    if (opts.maxTaxiFee > 0) {
      plans.push({
        id: "dyn_c",
        name: "지각 예방: 단절 구간 택시 결합",
        modes: ["taxi", "subway"],
        eta: "08:52",
        extraCost: 7200,
        risk: "low",
        crowd: "normal",
        confidence: "realtime",
        description: "버스의 지연 구역을 택시로 선제적 탈출 후 전철로 안착합니다.",
        timeline: [
          { mode: "taxi", detail: `${start} 정박지 택시 탑승`, duration: 8, cost: 5800 },
          { mode: "subway", detail: "환승역에서 지하철 지하철 탑승", duration: 8, cost: 1400 }
        ]
      });
    }
  }

  return plans;
}

// Custom comfort scores representing carriages
export interface CarDetail {
  carNo: string;
  crowdPercent: number; // e.g. 160% (very crowded), 80% (comfy)
  transferStatus: "fast" | "normal" | "slow";
  comfortRating: "안전" | "주의" | "경고" | "공포";
  reason: string;
}

export function getCarSurvivalDetails(line: string): CarDetail[] {
  return [
    { carNo: "1-1", crowdPercent: 65, transferStatus: "slow", comfortRating: "안전", reason: "상대적으로 출구와 멀어 한산하고 캐리어 휴대가 용이함" },
    { carNo: "2-2", crowdPercent: 110, transferStatus: "normal", comfortRating: "주의", reason: "적정 입석 분포를 유지하지만 손잡이 확보 가능" },
    { carNo: "3-3", crowdPercent: 55, transferStatus: "normal", comfortRating: "안전", reason: "주변 환승 벨트에서 이격되어 피로가 가장 적은 생존 구역 (추천)" },
    { carNo: "4-2", crowdPercent: 185, transferStatus: "fast", comfortRating: "공포", reason: "빠른 환승 승객의 비정상적 과밀 분포역, 하차 밀림 지옥 유발" },
    { carNo: "5-1", crowdPercent: 140, transferStatus: "normal", comfortRating: "경고", reason: "상당한 수준의 입석 밀도를 보이며 스마트폰 조작 불가능" },
    { carNo: "6-1", crowdPercent: 70, transferStatus: "normal", comfortRating: "안전", reason: "여유로운 공간으로 호흡 및 노트북 열람 가능 구역" }
  ];
}
