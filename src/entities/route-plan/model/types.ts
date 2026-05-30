export type TransitMode = "taxi" | "subway" | "walk" | "bike" | "bus";

export interface TimelineStep {
  mode: TransitMode;
  detail: string;
  duration: number;
  cost?: number;
}

export interface RoutePlan {
  id: string;
  name: string;
  modes: TransitMode[];
  eta: string;
  extraCost: number;
  risk: "low" | "medium" | "high";
  crowd: "empty" | "normal" | "crowded" | "very_crowded";
  description: string;
  timeline: TimelineStep[];
  confidence: "realtime" | "estimated" | "pattern";
  geometry?: RouteGeometry;
}

export interface RoutePlanOptions {
  useBike: boolean;
  maxTaxiFee: number;
}

export interface RouteGeometry {
  path?: Array<{ lat: number; lng: number }>;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
