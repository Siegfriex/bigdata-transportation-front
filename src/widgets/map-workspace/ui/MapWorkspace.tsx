import { ClipboardList, Plus, Search, Sparkles } from "lucide-react";
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
        <div className="space-y-2 pointer-events-auto">
          <div className="apple-glass rounded-2xl border border-white/10 p-3 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">현재 경로</span>
                <strong className="text-sm text-white block truncate">{startStation} → {endStation}</strong>
                <span className="text-[11px] text-white/60 block truncate">
                  {selectedPlan ? `${selectedPlan.name} · ${selectedPlan.eta} 도착` : "경로 후보를 계산 중입니다."}
                </span>
              </div>
              <span className="text-[10px] bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-1 rounded-lg font-mono shrink-0">
                {deadlineTime} 전
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                data-testid="open-report-detail"
                onClick={() => onSetMapLayer("report_detail")}
                className="py-2.5 bg-[#0A84FF] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>리포트 보기</span>
              </button>
              <button
                data-testid="open-ai-chat"
                onClick={() => onSetMapLayer("ai_overlay")}
                className="py-2.5 apple-glass-light border border-white/15 text-white/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors hover:text-white"
              >
                <Search className="w-3.5 h-3.5" />
                <span>AI 질문</span>
              </button>
            </div>
          </div>
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
