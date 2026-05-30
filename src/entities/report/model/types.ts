import type { RoutePlan } from "../../route-plan";

export type ReportType = "boarding" | "carriage" | "deadline" | "recovery";

export interface SavedReport {
  id: string;
  date: string;
  savedAt?: string;
  type: ReportType;
  selectedPlanId?: string;
  selectedPlanSnapshot?: RoutePlan;
  selectedStrategyId?: string;
  routePlanId?: string;
  decisionReportId?: string | null;
  from: string;
  to: string;
  status: "success" | "warning" | "danger";
  summary: string;
  cost: number;
  snapshotLabel?: string;
}
