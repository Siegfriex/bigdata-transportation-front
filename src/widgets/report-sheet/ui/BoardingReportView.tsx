import { AlertTriangle, ShieldCheck } from "lucide-react";
import { boardingComparison } from "../../../entities/report";

type BoardingReportViewProps = {
  startStation: string;
};

export function BoardingReportView({ startStation }: BoardingReportViewProps) {
  return (
    <div className="space-y-3">
      <div className="bg-[#FF9500]/10 border border-[#FF9500]/25 rounded-xl p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FF9500] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-[#FF9500] mb-0.5">이번 차량은 보내는 편이 안전합니다!</h4>
          <p className="text-[10px] text-white/70 leading-relaxed">
            {startStation} 부근 광역버스 배차진단 결과, 현재 기점 출발 인원이 만석으로 입점 정체 및 무정차가 예상됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="apple-glass border border-white/10 p-2.5 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-white/50 font-mono block uppercase">{boardingComparison.currentBus.label}</span>
          <span className="text-sm font-black text-[#FF3B30] tracking-tight">{boardingComparison.currentBus.etaLabel}</span>
          <span className="text-[10px] bg-[#FF3B30]/15 text-[#FF3B30] px-1.5 py-0.5 rounded-full inline-block font-mono">{boardingComparison.currentBus.seatStatus}</span>
          <span className="text-[9px] text-white/50 block">{boardingComparison.currentBus.crowdStatus}</span>
        </div>
        <div className="apple-glass border border-[#0A84FF]/30 p-2.5 rounded-xl text-center space-y-1 shadow-[0_4px_12px_rgba(10,132,255,0.15)]">
          <span className="text-[10px] text-[#0A84FF] font-mono block uppercase">{boardingComparison.nextBus.label}</span>
          <span className="text-sm font-black text-[#0A84FF] tracking-tight">{boardingComparison.nextBus.etaLabel}</span>
          <span className="text-[10px] bg-[#0A84FF]/15 text-[#0A84FF] px-1.5 py-0.5 rounded-full inline-block font-mono">{boardingComparison.nextBus.seatStatus}</span>
          <span className="text-[9px] text-white/70 block">{boardingComparison.nextBus.crowdStatus}</span>
        </div>
      </div>

      <div className="border-t border-white/15 pt-2 flex items-center justify-between text-[11px] text-white/70 font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>{boardingComparison.confidenceLabel}</span>
        </span>
        <span className="text-[#0A84FF]">{boardingComparison.recommendationLabel}</span>
      </div>
    </div>
  );
}
