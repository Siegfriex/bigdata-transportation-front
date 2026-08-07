export type MapLayerState =
  | "default"
  | "ai_overlay"
  | "ai_peek"
  | "ai_result"
  | "report_mini"
  | "report_summary"
  | "report_detail"
  | "evidence"
  | "map_peek";

export type TransitLayer = "subway" | "bus" | "bike" | "crowd";

export type VisibleLayers = Record<TransitLayer, boolean>;

export const DEFAULT_VISIBLE_LAYERS: VisibleLayers = {
  subway: true,
  bus: true,
  bike: false,
  crowd: true,
};
