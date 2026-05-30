import { Search, Sparkles } from "lucide-react";
import type { ReportType } from "../../../entities/report";
import { RoutePresetCarousel, type RoutePreset } from "../../../features/generate-route-plan";
import type { MapLayerState } from "../../../features/toggle-map-layer";

type MapWorkspaceProps = {
  mapLayer: MapLayerState;
  startStation: string;
  endStation: string;
  selectedReportType: ReportType;
  onSetMapLayer: (layer: MapLayerState) => void;
  onSelectPreset: (preset: RoutePreset) => void;
};

export function MapWorkspace({
  mapLayer,
  startStation,
  endStation,
  selectedReportType,
  onSetMapLayer,
  onSelectPreset,
}: MapWorkspaceProps) {
  return (
    <div className="relative flex-1 flex flex-col p-3 pt-4 gap-3 pointer-events-none justify-start">
      <div className="flex-1 shrink-0 min-h-[40px]" />

      <RoutePresetCarousel
        startStation={startStation}
        endStation={endStation}
        selectedReportType={selectedReportType}
        onSelectPreset={onSelectPreset}
      />

      {mapLayer === "default" && (
        <div
          className="surface-card control-base focus-ring relative flex cursor-pointer items-center justify-between p-3 pointer-events-auto"
          onClick={() => onSetMapLayer("ai_overlay")}
        >
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white/50" />
            <span className="type-body text-white/55">어디까지 가나요? (AI에게 묻기)</span>
          </div>
          <Sparkles className="w-5 h-5 text-[#0A84FF]" />
        </div>
      )}
    </div>
  );
}
