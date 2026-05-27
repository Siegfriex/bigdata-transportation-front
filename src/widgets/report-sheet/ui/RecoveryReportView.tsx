import { AlertTriangle } from "lucide-react";

export function RecoveryReportView() {
  return (
    <div className="space-y-3">
      <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/25 rounded-xl p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-[#FF3B30] mb-0.5">대중교통 단독 복구가 종료되었습니다.</h4>
          <p className="text-[10px] text-white/70 leading-relaxed">
            막차가 소진되었으므로, 불필요한 전구간 콜택시 수수료 낭비를 줄이기 위해 심야 연계 분할 전술(N버스 + 단거리 택시)을 가동합니다.
          </p>
        </div>
      </div>

      <div className="apple-glass border border-white/10 p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
          <span className="text-xs font-bold text-white">N버스 하이브리드 우회 (Plan A)</span>
          <span className="text-xs font-mono font-black text-[#0A84FF]">12,600원 소요</span>
        </div>
        <p className="text-[11px] text-white/70 leading-relaxed">
          홍대에서 중랑구 외곽까지 심야 N62번을 이용해 최대한 기동 후, 마지막 4.2km 구간에 한해서만 최소 택시로 복귀합니다.
        </p>
        <div className="bg-[#0A84FF]/10 text-[#0A84FF] text-[10px] p-2 rounded-lg font-mono flex justify-between items-center">
          <span>전구간 택시 대비 비용보전:</span>
          <strong>₩24,000 절약</strong>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">홍대 부근 24시 안심 대기 거점 (첫차연계)</span>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="apple-glass border border-white/10 p-2 rounded-lg flex items-center justify-between">
            <span className="text-white">🚨 동교치방 안심쉼터</span>
            <span className="text-[#0A84FF] font-mono">150m</span>
          </div>
          <div className="apple-glass border border-white/10 p-2 rounded-lg flex items-center justify-between">
            <span className="text-white">⚡ 24시 무인 충전룸</span>
            <span className="text-[#0A84FF] font-mono">320m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
