import { Bike, Bus, Car, Copy, Footprints, Train } from "lucide-react";
import type { RoutePlan } from "../../../entities/route-plan";

type DeadlineReportViewProps = {
  deadlineTime: string;
  startStation: string;
  endStation: string;
  plans: RoutePlan[];
  selectedPlan: RoutePlan | null;
  onSelectPlan: (plan: RoutePlan) => void;
  onCopySummary: (message: string) => void;
};

const getRiskLabel = (risk: RoutePlan["risk"]) => {
  if (risk === "low") return "낮음";
  if (risk === "medium") return "보통";
  return "높음";
};

const getRiskClassName = (risk: RoutePlan["risk"]) => {
  if (risk === "high") return "bg-[#FF3B30]";
  if (risk === "medium") return "bg-[#FF9500]";
  return "bg-[#0A84FF]";
};

export function DeadlineReportView({
  deadlineTime,
  startStation,
  endStation,
  plans,
  selectedPlan,
  onSelectPlan,
  onCopySummary,
}: DeadlineReportViewProps) {
  const handleCopySummary = () => {
    if (!selectedPlan) return;

    const summary = `[마감도착 비상 탈출 플랜]\n📍 출발: ${startStation}\n🏁 도착: ${endStation}\n⏱ 목표 시간: ${deadlineTime} 전\n\n[선택된 플랜: ${selectedPlan.name}]\n예상 도착 도착: ${selectedPlan.eta}\n추가 요금: ${selectedPlan.extraCost.toLocaleString()}원\n\n[타임라인 상세]\n${selectedPlan.timeline.map((step, idx) => `${idx + 1}. ${step.detail} (${step.duration}분)`).join("\n")}`;

    navigator.clipboard.writeText(summary);
    onCopySummary("🔗 경로 요약이 클립보드에 복사되었습니다.");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">마감도착 후보군 비교 ({deadlineTime} 전 도착기준)</span>
        <span className="text-[10px] bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full font-mono font-bold">도착확률 95%</span>
      </div>

      <div className="space-y-2">
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "apple-glass border-[#0A84FF]"
                  : "apple-glass/50 border-white/10 hover:bg-[#202428]"
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${getRiskClassName(plan.risk)}`} />
                  <span className="text-xs font-bold text-white">{plan.name}</span>
                </div>
                <span className="text-xs font-mono font-black text-[#0A84FF]">{plan.eta} 도착</span>
              </div>

              <p className="text-[10px] text-white/70 leading-relaxed mb-2">
                {plan.description}
              </p>

              <div className="flex justify-between items-center text-[9px] font-mono text-white/50 border-t border-white/15 pt-2">
                <div className="flex gap-2">
                  <span>추가 요금: {plan.extraCost.toLocaleString()}원</span>
                  <span>지연위험: {getRiskLabel(plan.risk)}</span>
                </div>
                <span className={`font-bold ${
                  plan.confidence === "realtime" ? "text-[#0A84FF]" : "text-white/50"
                }`}>
                  {plan.confidence === "realtime" ? "● 실시간 API" : "● 과거패턴"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="apple-glass-light border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-white/50 uppercase">선택 이동 타임라인 (Timeline MAP-04)</span>
            <button
              onClick={handleCopySummary}
              className="apple-glass border border-white/10 hover:bg-[#202428] text-white/70 hover:text-white px-2 py-1 rounded flex items-center gap-1.5 text-[9px] font-bold transition-all active:scale-95"
            >
              <Copy className="w-2.5 h-2.5" />
              <span>경로 복사</span>
            </button>
          </div>
          <div className="space-y-3 pt-2">
            {selectedPlan.timeline.map((step, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <div className="flex flex-col items-center mt-0.5">
                  <div className="w-5 h-5 rounded-full apple-glass border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-white">
                    {step.mode === "walk" && <Footprints className="w-2.5 h-2.5 opacity-70" />}
                    {step.mode === "subway" && <Train className="w-3 h-3 text-[#0A84FF]" />}
                    {step.mode === "bus" && <Bus className="w-3 h-3 text-[#0A84FF]" />}
                    {step.mode === "taxi" && <Car className="w-3 h-3 text-[#FF9500]" />}
                    {step.mode === "bike" && <Bike className="w-3 h-3 text-[#0A84FF]" />}
                  </div>
                  {idx < selectedPlan.timeline.length - 1 && (
                    <div className="w-[1.5px] h-6 bg-transparent rounded-full my-0.5" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex justify-between items-start">
                    <strong className="text-white text-[11px] leading-snug">{step.detail}</strong>
                    <span className="text-white/70 font-mono shrink-0 text-[10px]">{step.duration}분</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
