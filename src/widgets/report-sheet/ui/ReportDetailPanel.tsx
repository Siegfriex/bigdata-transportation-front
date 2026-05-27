import type { ReportType } from "../../../entities/report";
import type { CarDetail, RoutePlan } from "../../../entities/route-plan";
import { BoardingReportView } from "./BoardingReportView";
import { CarriageReportView } from "./CarriageReportView";
import { DeadlineReportView } from "./DeadlineReportView";
import { RecoveryReportView } from "./RecoveryReportView";
import { ReportActionBar } from "./ReportActionBar";
import { ReportTypeTabs } from "./ReportTypeTabs";

type ReportDetailPanelProps = {
  selectedReportType: ReportType;
  startStation: string;
  endStation: string;
  deadlineTime: string;
  plans: RoutePlan[];
  selectedPlan: RoutePlan | null;
  carDetails: CarDetail[];
  activeCarNo: string;
  onSelectReport: (reportType: ReportType, label: string) => void;
  onSelectCar: (carNo: string) => void;
  onSelectPlan: (plan: RoutePlan) => void;
  onCopySummary: (message: string) => void;
  onSaveReport: () => void;
  onAskAiBriefing: () => void;
};

export function ReportDetailPanel({
  selectedReportType,
  startStation,
  endStation,
  deadlineTime,
  plans,
  selectedPlan,
  carDetails,
  activeCarNo,
  onSelectReport,
  onSelectCar,
  onSelectPlan,
  onCopySummary,
  onSaveReport,
  onAskAiBriefing,
}: ReportDetailPanelProps) {
  return (
    <div className="space-y-2 pointer-events-auto bg-black/40 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
      <ReportTypeTabs
        selectedReportType={selectedReportType}
        onSelectReport={onSelectReport}
      />

      <div id="active-report-view" className="apple-glass rounded-2xl border border-white/10 p-3 space-y-3.5">
        {selectedReportType === "boarding" && (
          <BoardingReportView startStation={startStation} />
        )}

        {selectedReportType === "carriage" && (
          <CarriageReportView
            carDetails={carDetails}
            activeCarNo={activeCarNo}
            onSelectCar={onSelectCar}
          />
        )}

        {selectedReportType === "deadline" && (
          <DeadlineReportView
            deadlineTime={deadlineTime}
            startStation={startStation}
            endStation={endStation}
            plans={plans}
            selectedPlan={selectedPlan}
            onSelectPlan={onSelectPlan}
            onCopySummary={onCopySummary}
          />
        )}

        {selectedReportType === "recovery" && (
          <RecoveryReportView />
        )}

        <ReportActionBar
          onSaveReport={onSaveReport}
          onAskAiBriefing={onAskAiBriefing}
        />
      </div>
    </div>
  );
}
