import { useRef, type PointerEvent } from "react";
import type { ReportType } from "../../../entities/report";
import { routePresets, type RoutePreset } from "../model/presets";

type RoutePresetCarouselProps = {
  startStation: string;
  endStation: string;
  selectedReportType: ReportType;
  onSelectPreset: (preset: RoutePreset) => void;
};

const getUrgencyClassName = (urgency: RoutePreset["urgency"]) => {
  if (urgency === "high") return "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/30";
  if (urgency === "warn") return "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/30";
  return "text-[#A6D600] bg-[#A6D600]/10 border-[#A6D600]/30";
};

export function RoutePresetCarousel({
  startStation,
  endStation,
  selectedReportType,
  onSelectPreset,
}: RoutePresetCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    if (!element) return;
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
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
    <div
      ref={scrollRef}
      data-testid="route-preset-carousel"
      data-qa="map-route-carousel"
      className="w-full overflow-x-auto scrollbar-none pb-2 flex gap-3 pointer-events-auto snap-x touch-pan-x overscroll-x-contain cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {routePresets.map((preset) => {
        const isActive =
          startStation === preset.start &&
          endStation === preset.end &&
          selectedReportType === preset.report;

        return (
          <button
            key={`${preset.start}-${preset.end}-${preset.report}`}
            data-testid={`route-preset-${preset.report}`}
            data-qa={`map-route-card-${preset.report}`}
            aria-pressed={isActive}
            onClick={(event) => {
              if (dragStateRef.current.moved) {
                event.preventDefault();
                return;
              }
              onSelectPreset(preset);
            }}
            className={`control-base focus-ring group relative flex w-[180px] shrink-0 snap-center flex-col justify-between gap-1.5 overflow-hidden rounded-[16px] border p-3 text-left ${
              isActive
                ? "bg-[#0A84FF]/10 border-[#0A84FF]/50 shadow-[0_4px_16px_rgba(10,132,255,0.2)]"
                : "apple-glass border-white/10 hover:border-white/20 hover:bg-white/5 active:scale-[0.98]"
            }`}
          >
            {isActive && <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent pointer-events-none" />}
            <div className="flex items-start justify-between w-full">
              <span className={`type-caption flex items-center gap-1 rounded-md px-1.5 py-0.5 ${isActive ? "text-white bg-[#0A84FF]" : getUrgencyClassName(preset.urgency)}`}>
                {preset.tag}
              </span>
              <span className={`text-[10px] font-sans font-bold flex items-center gap-1 ${isActive ? "text-[#0A84FF]" : "text-white/50"}`}>
                {preset.start.replace("역", "")} <span className="opacity-50">→</span> {preset.end.replace("역", "")}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-2 relative z-10 w-full">
              <span className={`font-sans font-bold text-[14px] leading-tight tracking-tight ${isActive ? "text-white" : "text-white/90"}`}>
                {preset.title}
              </span>
              <span className={`font-sans text-[11px] leading-snug line-clamp-2 ${isActive ? "text-[#0A84FF] font-medium" : "text-white/60"}`}>
                {preset.summary}
              </span>
              <div className="w-full h-1 mt-2.5 bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${
                  preset.urgency === "high" ? "bg-[#FF3B30] w-[92%]" :
                  preset.urgency === "warn" ? "bg-[#FF9500] w-[78%]" :
                  "bg-[#A6D600] w-[40%]"
                }`} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
