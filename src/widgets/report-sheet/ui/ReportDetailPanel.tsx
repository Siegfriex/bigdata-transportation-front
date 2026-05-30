import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { ReportType } from "../../../entities/report";
import type { CarDetail, RoutePlan } from "../../../entities/route-plan";
import {
  decisionTone,
  severityBadgeClass,
  severityHexColor,
  severityLabel,
  severitySurfaceClass,
  severityTextSurfaceClass,
  type DecisionCode,
  type Severity,
} from "../../../shared/design-system";
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
  isRestoredSnapshot: boolean;
  savedReportId?: string;
  snapshotLabel?: string;
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
  isRestoredSnapshot,
  savedReportId,
  snapshotLabel,
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
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const strategyScrollerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });
  const deadlineStatus = activePlan?.risk === "low" ? "안정 도착" : activePlan?.risk === "medium" ? "도착 가능" : "대안 필요";
  const boardingStatus = activePlan?.crowd === "very_crowded" ? "압박 높음" : activePlan?.crowd === "crowded" ? "혼잡 주의" : "탑승 가능";
  const recoveryPlan = activePlan?.risk === "high" ? "즉시 대안 전환" : "대체 경로 대기";
  const decisionCode = getDecisionCode(activePlan);
  const decisionSeverity = decisionTone[decisionCode].tone;
  const decisionLabel = decisionTone[decisionCode].label;
  const decisionReason =
    decisionCode === "GO"
      ? "마감도착과 탑승 가능성이 모두 기준 안에 있습니다."
      : decisionCode === "TIGHT"
        ? "탑승 압박이 있어 대기/대체 후보를 함께 봐야 합니다."
        : "현재 후보는 실패 가능성이 높아 즉시 대안을 준비해야 합니다.";

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const element = strategyScrollerRef.current;
    if (!element) return;
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = strategyScrollerRef.current;
    if (!element || !dragStateRef.current.isDragging) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 4) dragStateRef.current.moved = true;
    element.scrollLeft = dragStateRef.current.scrollLeft - deltaX;
  };

  const handlePointerUp = () => {
    window.setTimeout(() => {
      dragStateRef.current = { ...dragStateRef.current, isDragging: false, moved: false };
    }, 0);
  };

  return (
    <div className="z-layer-sheet absolute inset-0 pointer-events-auto" data-testid="report-detail-overlay">
      <button
        className="absolute inset-0 bg-black/48 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="리포트 닫기"
      />

      <div
        data-testid="strategic-report-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="전략리포트"
        className="absolute inset-x-0 bottom-[64px] max-h-[calc(100vh-136px)] rounded-t-[28px] border border-white/12 bg-[#080B0E]/96 shadow-[0_-24px_60px_rgba(0,0,0,0.62)] backdrop-blur-2xl animate-in slide-in-from-bottom-8 fade-in duration-200"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="type-label badge-info rounded-full px-2 py-1">{isRestoredSnapshot ? "저장된 전략리포트" : "실시간 전략리포트"}</span>
              <span className="type-label text-white/38">{confidenceScore}% 신뢰</span>
            </div>
            <h2 className="mt-2 text-[18px] font-black leading-tight text-white">왜 이 경로가 선택됐는지</h2>
            <p className="type-caption mt-1 truncate text-white/52">{startStation} → {endStation} · {deadlineTime} 전 도착 기준</p>
            {isRestoredSnapshot && (
              <span data-testid="snapshot-badge" className="type-label mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-white/55">
                {snapshotLabel ?? "저장 시점 기준"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="control-base focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/62 hover:text-white"
            aria-label="리포트 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-234px)] overflow-y-auto px-4 pb-0 pt-3 scrollbar-none">
        {activePlan && (
          <DecisionBanner
            label={decisionLabel}
            reason={decisionReason}
            eta={activePlan.eta}
            severity={decisionSeverity}
          />
        )}

        {activePlan && (
          <section data-testid="strategic-report-summary-grid" className="mt-3 grid grid-cols-2 gap-2">
            <SummaryMetric testId="metric-deadline-success" label="마감도착" value={deadlineStatus} detail={`${deadlineTime} 기준 ${activePlan.eta}`} severity={activePlan.risk === "high" ? "danger" : "positive"} />
            <SummaryMetric testId="metric-boarding-risk" label="탑승가능성" value={boardingStatus} detail={getCrowdLabel(activePlan.crowd)} severity={activePlan.crowd === "very_crowded" ? "warning" : "positive"} />
            <SummaryMetric testId="metric-car-survival" label="추천칸/생존칸" value={activeCar?.carNo ?? activeCarNo} detail={activeCar?.comfortRating ?? "혼잡 회피"} severity="neutral" />
            <SummaryMetric testId="metric-recovery-plan" label="복구전략" value={recoveryPlan} detail={activePlan.risk === "high" ? "비용/시간 재비교" : "실패 시 후보 전환"} severity={activePlan.risk === "high" ? "warning" : "neutral"} />
          </section>
        )}

        <details className="mt-3 rounded-[14px] border border-white/10 bg-white/[0.035]">
          <summary className="control-base focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-xs font-bold text-white/70 marker:hidden">
            <span>경로 조건 수정</span>
            <span className="type-caption text-white/45">{startStation} → {endStation} · {deadlineTime}</span>
          </summary>
          <div className="border-t border-white/10 p-2">
            <RouteConditionCard
              startStation={startStation}
              endStation={endStation}
              deadlineTime={deadlineTime}
              onChangeStartStation={onChangeStartStation}
              onChangeEndStation={onChangeEndStation}
              onChangeDeadlineTime={onChangeDeadlineTime}
            />
          </div>
        </details>

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
          <div
            ref={strategyScrollerRef}
            data-testid="strategy-candidate-carousel"
            aria-label="전략 후보"
            className="flex snap-x gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {plans.map((plan, index) => {
              const isActive = activePlan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  data-testid={`strategy-candidate-card-${plan.id}`}
                  data-legacy-testid={`strategy-card-${plan.id}`}
                  aria-pressed={isActive}
                  aria-selected={isActive}
                  onClick={(event) => {
                    if (dragStateRef.current.moved) {
                      event.preventDefault();
                      return;
                    }
                    onSelectPlan(plan);
                  }}
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
              <ScoreBar label="지연 위험" value={riskScore} severity={activePlan.risk === "low" ? "positive" : activePlan.risk === "medium" ? "warning" : "danger"} />
              <ScoreBar label="혼잡 압력" value={crowdScore} severity={crowdScore > 70 ? "danger" : crowdScore > 40 ? "warning" : "positive"} />
              <ScoreBar label="근거 신뢰" value={confidenceScore} severity="neutral" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <EvidenceCard icon={<Clock className="h-4 w-4" />} label="도착 여유" value={`${deadlineTime} 기준 ${activePlan.eta}`} />
              <EvidenceCard icon={<Route className="h-4 w-4" />} label="전략 타입" value={activePlan.modes.map(getModeLabel).join(" + ")} />
              <EvidenceCard icon={<AlertTriangle className="h-4 w-4" />} label="불확실성" value={activePlan.confidence === "realtime" ? "실시간 데이터 우선" : "패턴 추정 포함"} />
              <EvidenceCard icon={<CheckCircle2 className="h-4 w-4" />} label="비용 영향" value={`${activePlan.extraCost.toLocaleString()}원`} />
            </div>

            <button
              data-testid="evidence-toggle-button"
              onClick={() => setIsEvidenceOpen((prev) => !prev)}
              className="control-base focus-ring mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5 text-left text-xs font-bold text-white hover:bg-white/10"
              aria-expanded={isEvidenceOpen}
            >
              <span>{isEvidenceOpen ? "근거 접기" : "근거보기"}</span>
              <span className="text-white/40">{isEvidenceOpen ? "상세 닫힘 가능" : "상세 4개 항목"}</span>
            </button>

            {isEvidenceOpen && (
              <div data-testid="evidence-detail-section" className="mt-3 space-y-3 rounded-[14px] border border-white/10 bg-black/24 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="type-label text-[#74B9FF]">근거 요약</span>
                    <h4 className="mt-1 text-sm font-bold leading-snug text-white">4대 지표별 판단 근거</h4>
                  </div>
                  <span className={`type-label rounded-full px-2 py-1 ${severityBadgeClass[decisionSeverity]}`}>
                    {decisionLabel}
                  </span>
                </div>
                <EvidenceLine label="마감도착 근거" value={`${deadlineTime} 전 ${activePlan.eta} 도착 예상`} detail={`총 ${totalDuration}분 소요. ${deadlineStatus} 판단입니다.`} severity={activePlan.risk === "high" ? "danger" : "positive"} />
                <EvidenceLine label="탑승가능성 근거" value={`혼잡 압력 ${getCrowdLabel(activePlan.crowd)}`} detail={`지연 위험은 ${activePlan.risk === "low" ? "낮음" : activePlan.risk === "medium" ? "중간" : "높음"}이며, 탑승 판단은 ${boardingStatus}입니다.`} severity={activePlan.crowd === "very_crowded" ? "warning" : "neutral"} />
                <EvidenceLine label="생존칸 근거" value={`${activeCar?.carNo ?? activeCarNo} 추천`} detail={activeCar?.reason ?? "환승 동선과 혼잡 압력을 기준으로 체감 밀도를 낮춥니다."} severity="neutral" />
                <EvidenceLine label="복구전략 근거" value={recoveryPlan} detail={activePlan.risk === "high" ? "실패 시 비용이 낮은 후보로 즉시 전환합니다." : "실패 시 다음 후보를 같은 리포트에서 바로 선택할 수 있습니다."} severity={activePlan.risk === "high" ? "warning" : "positive"} />
                <EvidenceLine label="선택 이유" value="현재 선택 전략 유지" detail={activePlan.description} severity="neutral" />
              </div>
            )}

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

function DecisionBanner({
  label,
  reason,
  eta,
  severity,
}: {
  label: string;
  reason: string;
  eta: string;
  severity: Exclude<Severity, "neutral">;
}) {
  return (
    <section data-testid="decision-banner" className={`rounded-[14px] border p-3 ${severitySurfaceClass[severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`type-label inline-flex rounded-full px-2 py-1 ${severityBadgeClass[severity]}`}>{label}</span>
          <h3 className="mt-2 text-[17px] font-black leading-tight text-white">현재 경로 판단: {label}</h3>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-white/74">{reason}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
          <span className="type-label block text-white/52">예상 도착</span>
          <strong className="font-mono text-lg font-black leading-none tabular-nums text-white">{eta}</strong>
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({
  testId,
  label,
  value,
  detail,
  severity,
}: {
  testId: string;
  label: string;
  value: string;
  detail: string;
  severity: Severity;
}) {
  return (
    <div data-testid={testId} className={`min-h-[92px] rounded-[14px] border p-3 ${severityTextSurfaceClass[severity]}`}>
      <span className="block text-[10px] font-extrabold leading-none opacity-90">{label}</span>
      <strong className="mt-2 block text-[18px] font-black leading-tight text-white">{value}</strong>
      <span className="type-caption mt-1.5 block text-white/72">{detail}</span>
    </div>
  );
}

function ScoreBar({ label, value, severity }: { label: string; value: number; severity: Severity }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/24 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="type-label text-white/42">{label}</span>
        <span className="type-metric text-white/62">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: severityHexColor[severity] }} />
      </div>
    </div>
  );
}

function EvidenceLine({
  label,
  value,
  detail,
  severity,
}: {
  label: string;
  value: string;
  detail: string;
  severity: Severity;
}) {
  return (
    <div data-testid="evidence-item" className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span data-testid="evidence-item-label" className="type-label block text-[#8FCAFF]">{label}</span>
        <span className={`type-label rounded-full px-2 py-0.5 ${severityBadgeClass[severity]}`}>{severityLabel[severity]}</span>
      </div>
      <p data-testid="evidence-item-value" className="text-sm font-bold leading-snug text-white">{value}</p>
      <p data-testid="evidence-item-detail" className="mt-1 text-xs font-medium leading-relaxed text-white/72">{detail}</p>
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

function getDecisionCode(plan: RoutePlan | null): DecisionCode {
  if (!plan) return "GO";
  if (plan.risk === "high") return "NO_GO";
  if (plan.risk === "medium" || plan.crowd === "very_crowded") return "TIGHT";
  return "GO";
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
