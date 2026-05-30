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
  return (
    <div className="w-full overflow-x-auto scrollbar-none pb-2 flex gap-3 pointer-events-auto snap-x">
      {routePresets.map((preset) => {
        const isActive =
          startStation === preset.start &&
          endStation === preset.end &&
          selectedReportType === preset.report;

        return (
          <button
            key={`${preset.start}-${preset.end}-${preset.report}`}
            onClick={() => onSelectPreset(preset)}
            className={`shrink-0 w-[176px] min-h-[112px] snap-center text-left p-3 rounded-[16px] border transition-all flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
              isActive
                ? "bg-[#0A84FF]/10 border-[#0A84FF]/50 shadow-[0_4px_16px_rgba(10,132,255,0.2)]"
                : "apple-glass border-white/10 hover:border-white/20 hover:bg-white/5 active:scale-[0.98]"
            }`}
          >
            {isActive && <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent pointer-events-none" />}
            <div className="flex items-start justify-between w-full">
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap ${isActive ? "text-white bg-[#0A84FF]" : getUrgencyClassName(preset.urgency)}`}>
                {preset.tag}
              </span>
              <span className={`text-[10px] font-sans font-bold flex items-center gap-1 min-w-0 ${isActive ? "text-[#0A84FF]" : "text-white/50"}`}>
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
