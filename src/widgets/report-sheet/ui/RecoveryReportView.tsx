import { AlertTriangle } from "lucide-react";
import { recoveryPlan } from "../../../entities/report";

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
          <span className="text-xs font-bold text-white">{recoveryPlan.title}</span>
          <span className="text-xs font-black text-[#0A84FF]">{recoveryPlan.estimatedCostLabel}</span>
        </div>
        <p className="text-[11px] text-white/70 leading-relaxed">
          {recoveryPlan.description}
        </p>
        <div className="type-caption flex items-center justify-between rounded-lg bg-[#0A84FF]/10 p-2 text-[#0A84FF]">
          <span>전구간 택시 대비 비용보전:</span>
          <strong>{recoveryPlan.savingLabel}</strong>
        </div>
      </div>

      <div className="space-y-1">
        <span className="type-label block text-white/50">{recoveryPlan.waitingHubAreaLabel}</span>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {recoveryPlan.waitingHubs.map((hub) => (
            <div key={hub.name} className="apple-glass border border-white/10 p-2 rounded-lg flex items-center justify-between">
              <span className="text-white">{hub.name}</span>
              <span className="type-metric text-[#0A84FF]">{hub.distanceLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
