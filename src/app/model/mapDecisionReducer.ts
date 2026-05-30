import type { SavedReport } from "../../entities/report";
import type { MapLayerState } from "../../features/toggle-map-layer";
import type { TabId } from "../../shared/config";

type AiReturnLayer = Extract<MapLayerState, "default" | "report_detail">;

export type MapDecisionState = {
  activeTab: TabId;
  mapLayer: MapLayerState;
  restoredReport: SavedReport | null;
  aiReturnLayer: AiReturnLayer;
};

export type MapDecisionAction =
  | { type: "TAB_CHANGED"; tab: TabId }
  | { type: "MAP_LAYER_SET"; layer: MapLayerState }
  | { type: "REPORT_CLOSED" }
  | { type: "ROUTE_PRESET_OPENED" }
  | { type: "LIVE_CONTEXT_SELECTED" }
  | { type: "SAVED_REPORT_RESTORED"; report: SavedReport }
  | { type: "AI_EVIDENCE_OPENED"; returnLayer: AiReturnLayer }
  | { type: "AI_EVIDENCE_CLOSED" }
  | { type: "REPORT_TYPE_SHOWN" };

export const initialMapDecisionState: MapDecisionState = {
  activeTab: "map",
  mapLayer: "default",
  restoredReport: null,
  aiReturnLayer: "default",
};

export function mapDecisionReducer(
  state: MapDecisionState,
  action: MapDecisionAction
): MapDecisionState {
  switch (action.type) {
    case "TAB_CHANGED":
      return action.tab === "map"
        ? { ...state, activeTab: action.tab, mapLayer: "default", aiReturnLayer: "default" }
        : { ...state, activeTab: action.tab };
    case "MAP_LAYER_SET":
      return {
        ...state,
        mapLayer: action.layer,
        aiReturnLayer: action.layer === "ai_overlay" ? "default" : state.aiReturnLayer,
      };
    case "REPORT_CLOSED":
      return { ...state, mapLayer: "default" };
    case "ROUTE_PRESET_OPENED":
      return { ...state, activeTab: "map", mapLayer: "report_detail", restoredReport: null };
    case "LIVE_CONTEXT_SELECTED":
      return { ...state, restoredReport: null };
    case "SAVED_REPORT_RESTORED":
      return { ...state, activeTab: "map", mapLayer: "report_detail", restoredReport: action.report };
    case "AI_EVIDENCE_OPENED":
      return { ...state, mapLayer: "ai_overlay", aiReturnLayer: action.returnLayer };
    case "AI_EVIDENCE_CLOSED":
      return { ...state, mapLayer: state.aiReturnLayer };
    case "REPORT_TYPE_SHOWN":
      return { ...state, activeTab: "map", mapLayer: "report_detail" };
    default:
      return state;
  }
}
