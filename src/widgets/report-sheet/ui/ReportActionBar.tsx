import { Bookmark, Sparkles } from "lucide-react";

type ReportActionBarProps = {
  onSaveReport: () => void;
  onAskAiBriefing: () => void;
};

export function ReportActionBar({ onSaveReport, onAskAiBriefing }: ReportActionBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
      <button
        id="save-report-action"
        onClick={onSaveReport}
        className="control-base focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-white/16 bg-white/[0.075] py-2.5 text-xs font-bold text-white hover:bg-white/12"
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span>전략 저장</span>
      </button>
      <button
        onClick={onAskAiBriefing}
        className="control-base focus-ring flex items-center justify-center gap-1.5 rounded-xl bg-[#0A84FF] py-2.5 text-xs font-bold text-white"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI 근거 질문</span>
      </button>
    </div>
  );
}
