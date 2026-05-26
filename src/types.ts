export type TabId = "map" | "archive" | "settings";

export type MapLayerState = 
  | "default"
  | "ai_overlay"
  | "ai_result"
  | "report_mini"
  | "report_summary"
  | "report_detail"
  | "evidence"
  | "map_peek";

export type ReportType = "boarding" | "carriage" | "deadline" | "recovery";

export interface TimelineStep {
  mode: "taxi" | "subway" | "walk" | "bike" | "bus";
  detail: string;
  duration: number; // in minutes
  cost?: number;
}

export interface RoutePlan {
  id: string;
  name: string;
  modes: ("taxi" | "subway" | "walk" | "bike" | "bus")[];
  eta: string;
  extraCost: number;
  risk: "low" | "medium" | "high";
  crowd: "empty" | "normal" | "crowded" | "very_crowded";
  description: string;
  timeline: TimelineStep[];
  confidence: "realtime" | "estimated" | "pattern";
}

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

export interface UserPreferences {
  home: string;
  work: string;
  crowdSensitivity: "low" | "normal" | "high";
  maxTaxiFee: number;
  walkLimitMin: number;
  useBike: boolean;
  aiStyle: "brief" | "detailed" | "emergency";
  favoriteRoutes: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedReportType?: ReportType | null;
  startStation?: string;
  endStation?: string;
  recommendedCarNo?: string;
  routeIndex?: number;
}
