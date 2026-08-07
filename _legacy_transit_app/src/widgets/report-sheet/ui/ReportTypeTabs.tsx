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
  { id: "deadline", label: "⏱️ 마감도착", toastLabel: "마감도착" },
  { id: "boarding", label: "🚍 탑승가능", toastLabel: "탑승가능" },
  { id: "carriage", label: "🚇 생존 칸", toastLabel: "생존 칸" },
  { id: "recovery", label: "🌙 실패복구", toastLabel: "실패복구" },
];

export function ReportTypeTabs({ selectedReportType, onSelectReport }: ReportTypeTabsProps) {
  return (
    <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none">
      {reportTypeOptions.map((reportType) => (
        <button
          key={reportType.id}
          onClick={() => onSelectReport(reportType.id, reportType.toastLabel)}
          className={`flex-1 min-w-[70px] py-2 text-center text-xs font-bold transition-all relative shrink-0 ${
            selectedReportType === reportType.id
              ? "text-[#0A84FF]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <span>{reportType.label}</span>
          {selectedReportType === reportType.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A84FF]" />
          )}
        </button>
      ))}
    </div>
  );
}
