import type { ReportType } from "../../../entities/report/model/types";

export interface RoutePreset {
  title: string;
  summary: string;
  start: string;
  end: string;
  report: ReportType;
  tag: string;
  urgency: "high" | "warn" | "medium";
  time?: string;
}

export const routePresets: RoutePreset[] = [
  {
    title: "9호선 급행 출근",
    summary: "현재 혼잡도 120% 초과",
    start: "염창역",
    end: "여의도역",
    report: "carriage",
    tag: "혼잡 높음",
    urgency: "high",
  },
  {
    title: "퇴근길 광역 버스",
    summary: "잔여 2석, 곧 만차 예상",
    start: "사당역",
    end: "강남역",
    report: "boarding",
    tag: "만차 임박",
    urgency: "warn",
  },
  {
    title: "심야 귀가 대안",
    summary: "택시 할증구간 진입 전",
    start: "홍대입구역",
    end: "남양주시",
    report: "recovery",
    tag: "심야 대안",
    urgency: "medium",
  },
];
