import { Bookmark, MessageSquareText } from "lucide-react";

type ReportActionBarProps = {
  onSaveReport: () => void;
  onAskAiBriefing: () => void;
};

export function ReportActionBar({ onSaveReport, onAskAiBriefing }: ReportActionBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-4 grid grid-cols-2 gap-2 border-t border-white/10 bg-[#080B0E]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-12px_28px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <button
        data-testid="save-report-button"
        id="save-report-action"
        onClick={onSaveReport}
        className="control-base focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/16 bg-white/[0.075] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/12"
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span>전략리포트 저장</span>
      </button>
      <button
        data-testid="ai-evidence-question-button"
        onClick={onAskAiBriefing}
        className="control-base focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0A84FF] px-3 py-2.5 text-xs font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,0.28)]"
      >
        <MessageSquareText className="w-3.5 h-3.5" />
        <span>AI 근거 질문</span>
      </button>
    </div>
  );
}
