import { BookmarkCheck, ChevronRight, Trash2 } from "lucide-react";
import type { SavedReport } from "../../../entities/report";
import { archiveCalendarConfig } from "../model/config";

type ArchiveCalendarProps = {
  savedReports: SavedReport[];
  selectedCalendarDay: number;
  onSelectCalendarDay: (day: number) => void;
  onClearReports: () => void;
  onRestoreReport: (report: SavedReport) => void;
};

function getReportDay(report: SavedReport) {
  const match = report.date.match(/-(\d{2})$/);
  return match ? parseInt(match[1], 10) : null;
}

function getReportTypeLabel(report: SavedReport) {
  if (report.type === "deadline") return "마감도착";
  if (report.type === "carriage") return "혼잡회피";
  if (report.type === "boarding") return "탑승가능";
  return "실패복구";
}

function getReportStatusClassName(report: SavedReport) {
  if (report.status === "success") return "bg-[#0A84FF]/10 text-[#0A84FF]";
  if (report.status === "warning") return "bg-[#FF9500]/10 text-[#FF9500]";
  return "bg-[#FF3B30]/10 text-[#FF3B30]";
}

export function ArchiveCalendar({
  savedReports,
  selectedCalendarDay,
  onSelectCalendarDay,
  onClearReports,
  onRestoreReport,
}: ArchiveCalendarProps) {
  const savedReportDays = new Set(savedReports.map((report) => report.date));
  const safeReports = savedReports.filter((report) => report.status === "success").length;
  const safeArrivalRateLabel = savedReports.length > 0
    ? `${Math.round((safeReports / savedReports.length) * 100)}%`
    : "-";

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 absolute inset-0 z-10 overflow-y-auto bg-black/80 backdrop-blur-3xl pointer-events-auto">
      <div className="apple-glass border border-white/10 rounded-2xl p-3 flex justify-between items-center shrink-0">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono text-white/50 uppercase">{archiveCalendarConfig.statsEyebrow}</span>
          <div className="text-sm font-bold text-white">{archiveCalendarConfig.statsTitle}</div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-[#0A84FF] font-mono">{safeArrivalRateLabel}</span>
        </div>
      </div>

      <div className="apple-glass border border-white/10 rounded-2xl p-3.5 space-y-3 shrink-0">
        <div className="flex justify-between items-center border-b border-white/15 pb-2">
          <span className="text-xs font-bold font-mono text-white">{archiveCalendarConfig.monthLabel} 통근캘린더</span>
          <span className="text-[10px] text-[#0A84FF] font-mono">총 {savedReportDays.size}일 출근</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-white/50">
          {archiveCalendarConfig.weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
          {Array.from({ length: archiveCalendarConfig.daysInMonth }, (_, index) => {
            const day = index + 1;
            const isSelect = selectedCalendarDay === day;
            const reportsForDay = savedReports.filter((report) => getReportDay(report) === day);

            let statusColor = "bg-transparent text-white/50";
            if (reportsForDay.length > 0) {
              const hasFail = reportsForDay.some((report) => report.status === "danger" || report.status === "warning");
              statusColor = hasFail
                ? "bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30"
                : "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30";
            }

            return (
              <button
                key={day}
                onClick={() => onSelectCalendarDay(day)}
                className={`py-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isSelect ? "ring-2 ring-white ring-offset-2 ring-offset-[#141618] z-10" : ""
                } ${statusColor}`}
              >
                <span>{day}</span>
                {reportsForDay.length > 0 && (
                  <div className="flex gap-[2px]">
                    {reportsForDay.slice(0, 3).map((report, idx) => (
                      <span key={`${report.id}-${idx}`} className={`w-1 h-1 rounded-full ${report.status === "success" ? "bg-[#0A84FF]" : "bg-[#FF3B30]"}`} />
                    ))}
                    {reportsForDay.length > 3 && <span className="w-1 h-1 rounded-full bg-white/50" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="apple-glass-light border border-white/15 rounded-xl p-2.5 text-[11px] leading-relaxed">
          <span className="text-[#0A84FF] font-bold block mb-1">{archiveCalendarConfig.feedbackMonthLabel} {selectedCalendarDay}일 통근 피드백</span>
          {(() => {
            const selectedReports = savedReports.filter((report) => getReportDay(report) === selectedCalendarDay);
            if (selectedReports.length === 0) {
              return <span className="text-white/50 block">저장된 통근 리포트가 없습니다.</span>;
            }
            return (
              <div className="space-y-1 block">
                {selectedReports.map((report) => (
                  <span key={report.id} className={`${report.status === "danger" || report.status === "warning" ? "text-[#FF3B30]" : "text-white/90"} block`}>
                    {report.summary}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block">보관된 최신 안전 리포트</span>
          <button
            onClick={onClearReports}
            className="text-[10px] text-[#FF3B30] hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>모두 지우기</span>
          </button>
        </div>

        {savedReports.length === 0 ? (
          <div className="apple-glass/40 border border-white/10 p-8 text-center rounded-2xl">
            <BookmarkCheck className="w-8 h-8 text-[#2D3135] mx-auto mb-2" />
            <span className="text-xs text-white/50 font-mono block">보관된 안전 리포트가 없습니다.</span>
          </div>
        ) : (
          savedReports.map((report) => (
            <div
              key={report.id}
              className="apple-glass border border-white/10 rounded-xl p-3 space-y-2 relative"
            >
              <div className="flex justify-between items-center">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getReportStatusClassName(report)}`}>
                  {getReportTypeLabel(report)}
                </span>
                <span className="text-[10px] font-mono text-white/50">{report.date}</span>
              </div>

              <p className="text-xs font-bold text-white">{report.summary}</p>

              <div className="flex justify-between items-center gap-2 text-[10px] font-mono text-white/50 border-t border-white/15 pt-2">
                <span className="min-w-0 truncate">출발-도착: {report.from} ↔ {report.to}</span>
                <button
                  onClick={() => onRestoreReport(report)}
                  className="text-[#0A84FF] flex items-center gap-1 hover:underline shrink-0"
                >
                  <span>지도 이동</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
