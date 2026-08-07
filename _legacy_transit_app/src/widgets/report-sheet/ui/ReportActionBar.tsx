import { Bookmark, Sparkles } from "lucide-react";

type ReportActionBarProps = {
  onSaveReport: () => void;
  onAskAiBriefing: () => void;
};

export function ReportActionBar({ onSaveReport, onAskAiBriefing }: ReportActionBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
      <button
        id="save-report-action"
        onClick={onSaveReport}
        className="py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span>보관함 저장</span>
      </button>
      <button
        onClick={onAskAiBriefing}
        className="py-2.5 bg-[#0A84FF] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI 원인 브리핑</span>
      </button>
    </div>
  );
}
