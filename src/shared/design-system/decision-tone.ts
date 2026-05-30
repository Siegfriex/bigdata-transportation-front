export type DecisionCode = "GO" | "TIGHT" | "NO_GO";
export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";
export type Severity = "positive" | "neutral" | "warning" | "danger";

export const decisionTone = {
  GO: {
    label: "탈 수 있음",
    tone: "positive",
  },
  TIGHT: {
    label: "빠듯함",
    tone: "warning",
  },
  NO_GO: {
    label: "어려움",
    tone: "danger",
  },
} as const satisfies Record<DecisionCode, { label: string; tone: Severity }>;

export const severityBadgeClass = {
  positive: "badge-success",
  neutral: "badge-info",
  warning: "badge-warning",
  danger: "badge-danger",
} as const satisfies Record<Severity, string>;

export const severityLabel = {
  positive: "안정",
  neutral: "근거",
  warning: "주의",
  danger: "위험",
} as const satisfies Record<Severity, string>;

export const severitySurfaceClass = {
  positive: "border-[#3DDC97]/35 bg-[#3DDC97]/10",
  neutral: "border-[#2F9BFF]/35 bg-[#2F9BFF]/10",
  warning: "border-[#FFB020]/35 bg-[#FFB020]/10",
  danger: "border-[#FF5A52]/35 bg-[#FF5A52]/10",
} as const satisfies Record<Severity, string>;

export const severityTextSurfaceClass = {
  positive: "border-[#3DDC97]/35 bg-[#3DDC97]/10 text-[#3DDC97]",
  neutral: "border-[#2F9BFF]/35 bg-[#2F9BFF]/10 text-[#74B9FF]",
  warning: "border-[#FFB020]/35 bg-[#FFB020]/10 text-[#FFB020]",
  danger: "border-[#FF5A52]/35 bg-[#FF5A52]/10 text-[#FF5A52]",
} as const satisfies Record<Severity, string>;

export const severityHexColor = {
  positive: "#3DDC97",
  neutral: "#2F9BFF",
  warning: "#FFB020",
  danger: "#FF5A52",
} as const satisfies Record<Severity, string>;
