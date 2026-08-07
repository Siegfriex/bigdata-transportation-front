export type ReportType = "boarding" | "carriage" | "deadline" | "recovery";

export interface SavedReport {
  id: string;
  date: string;
  type: ReportType;
  from: string;
  to: string;
  status: "success" | "warning" | "danger";
  summary: string;
  cost: number;
}
