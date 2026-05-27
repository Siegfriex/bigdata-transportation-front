import type { SavedReport } from "../model/types";

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
      cost: 8000,
    },
    {
      id: "rep-02",
      date: "2026-05-25",
      type: "carriage",
      from: "염창역",
      to: "여의도역",
      status: "success",
      summary: "9호선 급행 3-3번 생존 칸 탑승: 입석 혼잡압력 40% 감축 해결",
      cost: 1400,
    },
    {
      id: "rep-03",
      date: "2026-05-24",
      type: "recovery",
      from: "홍대입구역",
      to: "남양주시",
      status: "warning",
      summary: "심야 귀가: N버스 + 단거리 택시 분할 전술로 택시비 24,000원 대폭 절약",
      cost: 9800,
    },
  ];
}
