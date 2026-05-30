import type { ReportType } from "../../../entities/report";

type ReportTypeOption = {
  id: ReportType;
  label: string;
  toastLabel: string;
};

type ReportTypeTabsProps = {
  selectedReportType: ReportType;
  onSelectReport: (reportType: ReportType, toastLabel: string) => void;
};

const reportTypeOptions: ReportTypeOption[] = [
  { id: "deadline", label: "마감도착", toastLabel: "마감도착" },
  { id: "boarding", label: "탑승가능", toastLabel: "탑승가능" },
  { id: "carriage", label: "생존 칸", toastLabel: "생존 칸" },
  { id: "recovery", label: "실패복구", toastLabel: "실패복구" },
];

export function ReportTypeTabs({ selectedReportType, onSelectReport }: ReportTypeTabsProps) {
  return (
    <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-1 scrollbar-none">
      {reportTypeOptions.map((reportType) => (
        <button
          key={reportType.id}
          onClick={() => onSelectReport(reportType.id, reportType.toastLabel)}
          className={`control-base focus-ring relative min-w-[70px] flex-1 shrink-0 py-2 text-center text-xs font-bold ${
            selectedReportType === reportType.id
              ? "bg-[#0A84FF]/12 text-[#74B9FF]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <span>{reportType.label}</span>
          {selectedReportType === reportType.id && (
            <div className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#0A84FF]" />
          )}
        </button>
      ))}
    </div>
  );
}
