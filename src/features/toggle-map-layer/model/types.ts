export type MapLayerState =
  | "default"
  | "ai_overlay"
  | "ai_peek"
  | "report_detail";

export type TransitLayer = "subway" | "bus" | "bike" | "crowd";

export type VisibleLayers = Record<TransitLayer, boolean>;

export const DEFAULT_VISIBLE_LAYERS: VisibleLayers = {
  subway: true,
  bus: true,
  bike: false,
  crowd: true,
};
