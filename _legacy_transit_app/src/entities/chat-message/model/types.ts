import type { ReportType } from "../../report/model/types";

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

export interface AiChatResponse {
  textAnswer: string;
  suggestedReportType?: ReportType | null;
  startStation?: string;
  endStation?: string;
  recommendedCarNo?: string;
  routeIndex?: number;
}
