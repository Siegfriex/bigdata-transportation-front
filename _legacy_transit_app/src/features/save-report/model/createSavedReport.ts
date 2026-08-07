import type { ReportType, SavedReport } from "../../../entities/report/model/types";
import type { RoutePlan } from "../../../entities/route-plan/model/types";

const reportLabelMap: Record<ReportType, string> = {
  boarding: "실시간 탑승가능성 진단",
  carriage: "지하철 최적 생존 칸 추천",
  deadline: "9시 마감 연담 탈출",
  recovery: "심야 교통 단축 복구",
};

export function isDuplicateSavedReport(
  reports: SavedReport[],
  input: { from: string; to: string; type: ReportType }
): boolean {
  return reports.some(
    (report) => report.from === input.from && report.to === input.to && report.type === input.type
  );
}

export function createSavedReport(input: {
  selectedPlan: RoutePlan;
  selectedReportType: ReportType;
  startStation: string;
  endStation: string;
  now?: Date;
}): SavedReport {
  const { selectedPlan, selectedReportType, startStation, endStation, now = new Date() } = input;

  return {
    id: `rep-${now.getTime()}`,
    date: now.toISOString().split("T")[0],
    type: selectedReportType,
    from: startStation,
    to: endStation,
    status: selectedPlan.risk === "high" ? "danger" : selectedPlan.risk === "medium" ? "warning" : "success",
    summary: `${reportLabelMap[selectedReportType]}: ${startStation} ↔ ${endStation} (${selectedPlan.eta} 예상)`,
    cost: selectedPlan.extraCost,
  };
}
