import type { ReactNode } from "react";
import type { ReportType } from "../../../entities/report";
import type { CarDetail, RoutePlan } from "../../../entities/route-plan";
import { AlertTriangle, Bike, Bus, Car, CheckCircle2, Clock, Footprints, Route, Train, X } from "lucide-react";
import { ReportActionBar } from "./ReportActionBar";
import { ReportTypeTabs } from "./ReportTypeTabs";
import { RouteConditionCard } from "./RouteConditionCard";

type ReportDetailPanelProps = {
  selectedReportType: ReportType;
  startStation: string;
  endStation: string;
  deadlineTime: string;
  plans: RoutePlan[];
  selectedPlan: RoutePlan | null;
  carDetails: CarDetail[];
  activeCarNo: string;
  onClose: () => void;
  onChangeStartStation: (station: string) => void;
  onChangeEndStation: (station: string) => void;
  onChangeDeadlineTime: (time: string) => void;
  onSelectReport: (reportType: ReportType, label: string) => void;
  onSelectCar: (carNo: string) => void;
  onSelectPlan: (plan: RoutePlan) => void;
  onSaveReport: () => void;
  onAskAiBriefing: () => void;
};

export function ReportDetailPanel({
  selectedReportType,
  startStation,
  endStation,
  deadlineTime,
  plans,
  selectedPlan,
  carDetails,
  activeCarNo,
  onClose,
  onChangeStartStation,
  onChangeEndStation,
  onChangeDeadlineTime,
  onSelectReport,
  onSelectCar,
  onSelectPlan,
  onSaveReport,
  onAskAiBriefing,
}: ReportDetailPanelProps) {
  const activePlan = selectedPlan ?? plans[0] ?? null;
  const totalDuration = activePlan?.timeline.reduce((sum, step) => sum + step.duration, 0) ?? 0;
  const riskScore = activePlan?.risk === "low" ? 22 : activePlan?.risk === "medium" ? 56 : 84;
  const crowdScore =
    activePlan?.crowd === "empty" ? 8 :
    activePlan?.crowd === "normal" ? 34 :
    activePlan?.crowd === "crowded" ? 68 : 90;
  const confidenceScore =
    activePlan?.confidence === "realtime" ? 92 :
    activePlan?.confidence === "estimated" ? 74 : 62;
  const activeCar = carDetails.find((car) => car.carNo === activeCarNo);

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto" data-testid="report-detail-overlay">
      <button
        className="absolute inset-0 bg-black/48 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="리포트 닫기"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[calc(100vh-72px)] rounded-t-[28px] border border-white/12 bg-[#080B0E]/96 shadow-[0_-24px_60px_rgba(0,0,0,0.62)] backdrop-blur-2xl animate-in slide-in-from-bottom-8 fade-in duration-200">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="type-label badge-info rounded-full px-2 py-1">실시간 전략 리포트</span>
              <span className="type-label text-white/38">{confidenceScore}% 신뢰</span>
            </div>
            <h2 className="mt-2 text-[18px] font-black leading-tight text-white">왜 이 경로가 선택됐는지</h2>
            <p className="type-caption mt-1 truncate text-white/52">{startStation} → {endStation} · {deadlineTime} 전 도착 기준</p>
          </div>
          <button
            onClick={onClose}
            className="control-base focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/58 hover:text-white"
            aria-label="리포트 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-170px)] overflow-y-auto px-4 pb-4 pt-3 scrollbar-none">
        <RouteConditionCard
          startStation={startStation}
          endStation={endStation}
          deadlineTime={deadlineTime}
          onChangeStartStation={onChangeStartStation}
          onChangeEndStation={onChangeEndStation}
          onChangeDeadlineTime={onChangeDeadlineTime}
        />

        <div className="mt-3">
          <ReportTypeTabs
            selectedReportType={selectedReportType}
            onSelectReport={onSelectReport}
          />
        </div>

        <section className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="type-title text-white">전략 후보</h3>
            <span className="type-caption text-white/45">가로 스와이프</span>
          </div>
          <div className="flex snap-x gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {plans.map((plan, index) => {
              const isActive = activePlan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  data-testid={`strategy-card-${plan.id}`}
                  aria-pressed={isActive}
                  onClick={() => onSelectPlan(plan)}
                  className={`control-base focus-ring min-w-[230px] snap-start rounded-2xl border p-3 text-left ${
                    isActive ? "border-[#2F9BFF] bg-[#2F9BFF]/12" : "border-white/10 bg-white/[0.055] hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="type-label text-white/42">전략 {index + 1}</span>
                    <span className={`type-label rounded-full px-2 py-1 ${plan.risk === "low" ? "badge-success" : plan.risk === "medium" ? "badge-warning" : "badge-danger"}`}>
                      {plan.risk === "low" ? "안정" : plan.risk === "medium" ? "주의" : "위험"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] font-extrabold leading-snug text-white">{plan.name.replace(/^추천:\s?/, "")}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <MetricTile label="도착" value={plan.eta} />
                    <MetricTile label="비용" value={`${Math.round(plan.extraCost / 1000)}천`} />
                    <MetricTile label="혼잡" value={getCrowdLabel(plan.crowd)} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {activePlan && (
          <section className="surface-card mt-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="type-label text-[#74B9FF]">선택 전략</span>
                <h3 className="mt-1 text-[16px] font-black leading-snug text-white">{activePlan.name.replace(/^추천:\s?/, "")}</h3>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-right">
                <span className="type-label block text-white/42">예상 소요</span>
                <strong className="font-mono text-sm text-white">{totalDuration}분</strong>
              </div>
            </div>

            <p className="type-body mt-3 text-white/70">{activePlan.description}</p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <ScoreBar label="지연 위험" value={riskScore} tone={activePlan.risk === "low" ? "good" : activePlan.risk === "medium" ? "warn" : "bad"} />
              <ScoreBar label="혼잡 압력" value={crowdScore} tone={crowdScore > 70 ? "bad" : crowdScore > 40 ? "warn" : "good"} />
              <ScoreBar label="근거 신뢰" value={confidenceScore} tone="info" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <EvidenceCard icon={<Clock className="h-4 w-4" />} label="도착 여유" value={`${deadlineTime} 기준 ${activePlan.eta}`} />
              <EvidenceCard icon={<Route className="h-4 w-4" />} label="전략 타입" value={activePlan.modes.map(getModeLabel).join(" + ")} />
              <EvidenceCard icon={<AlertTriangle className="h-4 w-4" />} label="불확실성" value={activePlan.confidence === "realtime" ? "실시간 데이터 우선" : "패턴 추정 포함"} />
              <EvidenceCard icon={<CheckCircle2 className="h-4 w-4" />} label="비용 영향" value={`${activePlan.extraCost.toLocaleString()}원`} />
            </div>

            <div className="mt-4">
              <h4 className="type-label mb-2 text-white/50">이동 타임라인</h4>
              <div className="space-y-3">
                {activePlan.timeline.map((step, index) => (
                  <div key={`${step.detail}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-[#74B9FF]">
                        {getModeIcon(step.mode)}
                      </div>
                      {index < activePlan.timeline.length - 1 && <div className="mt-1 h-6 w-px bg-white/12" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="type-caption text-white">{step.detail}</p>
                        <span className="type-metric shrink-0 text-white/55">{step.duration}분</span>
                      </div>
                      {step.cost !== undefined && <p className="type-caption mt-0.5 text-white/38">{step.cost.toLocaleString()}원 반영</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {selectedReportType === "carriage" && activeCar && (
          <section className="surface-card mt-3 p-3">
            <div className="flex items-center justify-between">
              <h3 className="type-title text-white">생존 칸 근거</h3>
              <span className="type-label badge-info rounded-full px-2 py-1">{activeCarNo}</span>
            </div>
            <p className="type-body mt-2 text-white/66">{activeCar.reason}</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {carDetails.map((car) => (
                <button
                  key={car.carNo}
                  onClick={() => onSelectCar(car.carNo)}
                  className={`control-base focus-ring rounded-xl border px-2 py-2 text-center ${
                    car.carNo === activeCarNo ? "border-[#2F9BFF] bg-[#2F9BFF]/14 text-white" : "border-white/10 bg-white/[0.045] text-white/58"
                  }`}
                >
                  <span className="type-caption block">{car.carNo}</span>
                  <span className="type-metric block">{car.crowdPercent}%</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <ReportActionBar
          onSaveReport={onSaveReport}
          onAskAiBriefing={onAskAiBriefing}
        />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/24 px-2 py-1.5">
      <span className="type-label block text-white/35">{label}</span>
      <strong className="type-caption text-white">{value}</strong>
    </div>
  );
}

function ScoreBar({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" | "info" }) {
  const color = tone === "good" ? "#3DDC97" : tone === "warn" ? "#FFB020" : tone === "bad" ? "#FF5A52" : "#2F9BFF";
  return (
    <div className="rounded-xl border border-white/10 bg-black/24 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="type-label text-white/42">{label}</span>
        <span className="type-metric text-white/62">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function EvidenceCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[#74B9FF]">{icon}<span className="type-label">{label}</span></div>
      <p className="type-caption text-white/72">{value}</p>
    </div>
  );
}

function getCrowdLabel(crowd: RoutePlan["crowd"]) {
  if (crowd === "empty") return "낮음";
  if (crowd === "normal") return "보통";
  if (crowd === "crowded") return "높음";
  return "극심";
}

function getModeLabel(mode: RoutePlan["modes"][number]) {
  if (mode === "taxi") return "택시";
  if (mode === "subway") return "지하철";
  if (mode === "walk") return "도보";
  if (mode === "bike") return "따릉이";
  return "버스";
}

function getModeIcon(mode: RoutePlan["modes"][number]) {
  if (mode === "taxi") return <Car className="h-3.5 w-3.5" />;
  if (mode === "subway") return <Train className="h-3.5 w-3.5" />;
  if (mode === "walk") return <Footprints className="h-3.5 w-3.5" />;
  if (mode === "bike") return <Bike className="h-3.5 w-3.5" />;
  return <Bus className="h-3.5 w-3.5" />;
}
