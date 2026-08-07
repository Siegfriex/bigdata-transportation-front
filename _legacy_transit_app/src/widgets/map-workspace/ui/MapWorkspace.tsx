import { Plus, Search, Sparkles } from "lucide-react";
import type { ReportType } from "../../../entities/report";
import type { CarDetail, RoutePlan } from "../../../entities/route-plan";
import { RoutePresetCarousel, type RoutePreset } from "../../../features/generate-route-plan";
import type { MapLayerState } from "../../../features/toggle-map-layer";
import { ReportDetailPanel, RouteConditionCard } from "../../report-sheet";

type MapWorkspaceProps = {
  mapLayer: MapLayerState;
  startStation: string;
  endStation: string;
  deadlineTime: string;
  selectedReportType: ReportType;
  plans: RoutePlan[];
  selectedPlan: RoutePlan | null;
  carDetails: CarDetail[];
  activeCarNo: string;
  onSetMapLayer: (layer: MapLayerState) => void;
  onSelectPreset: (preset: RoutePreset) => void;
  onChangeStartStation: (station: string) => void;
  onChangeEndStation: (station: string) => void;
  onChangeDeadlineTime: (time: string) => void;
  onSelectReport: (reportType: ReportType, label: string) => void;
  onSelectCar: (carNo: string) => void;
  onSelectPlan: (plan: RoutePlan) => void;
  onCopySummary: (message: string) => void;
  onSaveReport: () => void;
  onAskAiBriefing: () => void;
};

export function MapWorkspace({
  mapLayer,
  startStation,
  endStation,
  deadlineTime,
  selectedReportType,
  plans,
  selectedPlan,
  carDetails,
  activeCarNo,
  onSetMapLayer,
  onSelectPreset,
  onChangeStartStation,
  onChangeEndStation,
  onChangeDeadlineTime,
  onSelectReport,
  onSelectCar,
  onSelectPlan,
  onCopySummary,
  onSaveReport,
  onAskAiBriefing,
}: MapWorkspaceProps) {
  return (
    <div className="flex-1 flex flex-col p-3 pt-4 space-y-3 pointer-events-none justify-start">
      <div className="flex-1 shrink-0 min-h-[40px]" />

      <RoutePresetCarousel
        startStation={startStation}
        endStation={endStation}
        selectedReportType={selectedReportType}
        onSelectPreset={onSelectPreset}
      />

      {mapLayer === "default" && (
        <div
          className="apple-glass rounded-2xl border border-white/10 p-3 shadow-md relative pointer-events-auto flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onSetMapLayer("ai_overlay")}
        >
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white/50" />
            <span className="text-white/50 font-medium text-sm">어디까지 가나요? (AI에게 묻기)</span>
          </div>
          <Sparkles className="w-5 h-5 text-[#0A84FF]" />
        </div>
      )}

      {mapLayer === "report_detail" && (
        <>
          <div className="flex justify-between items-center px-1 pointer-events-auto">
            <span className="font-bold text-white text-sm">리포트 상세</span>
            <button onClick={() => onSetMapLayer("default")} className="text-white/50 hover:text-white p-1">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <RouteConditionCard
            startStation={startStation}
            endStation={endStation}
            deadlineTime={deadlineTime}
            onChangeStartStation={onChangeStartStation}
            onChangeEndStation={onChangeEndStation}
            onChangeDeadlineTime={onChangeDeadlineTime}
          />

          <ReportDetailPanel
            selectedReportType={selectedReportType}
            startStation={startStation}
            endStation={endStation}
            deadlineTime={deadlineTime}
            plans={plans}
            selectedPlan={selectedPlan}
            carDetails={carDetails}
            activeCarNo={activeCarNo}
            onSelectReport={onSelectReport}
            onSelectCar={onSelectCar}
            onSelectPlan={onSelectPlan}
            onCopySummary={onCopySummary}
            onSaveReport={onSaveReport}
            onAskAiBriefing={onAskAiBriefing}
          />
        </>
      )}
    </div>
  );
}
