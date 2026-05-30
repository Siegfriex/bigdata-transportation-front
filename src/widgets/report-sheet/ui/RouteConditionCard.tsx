import { Clock } from "lucide-react";
import { stationNames } from "../../../entities/station";

type RouteConditionCardProps = {
  startStation: string;
  endStation: string;
  deadlineTime: string;
  onChangeStartStation: (stationName: string) => void;
  onChangeEndStation: (stationName: string) => void;
  onChangeDeadlineTime: (time: string) => void;
};

export function RouteConditionCard({
  startStation,
  endStation,
  deadlineTime,
  onChangeStartStation,
  onChangeEndStation,
  onChangeDeadlineTime,
}: RouteConditionCardProps) {
  return (
    <div className="surface-card stack-md relative p-3 pointer-events-auto">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="type-label block text-white/50">출발 정박사</label>
          <div className="relative">
            <select
              id="start-station-select"
              value={startStation}
              onChange={(event) => onChangeStartStation(event.target.value)}
              className="focus-ring w-full appearance-none rounded-xl border border-white/15 bg-white/[0.07] py-2 pl-2 pr-6 text-xs font-bold text-white outline-none focus:border-[#0A84FF]"
            >
              {stationNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-2.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="type-label block text-white/50">목적 대피지</label>
          <div className="relative">
            <select
              id="end-station-select"
              value={endStation}
              onChange={(event) => onChangeEndStation(event.target.value)}
              className="focus-ring w-full appearance-none rounded-xl border border-white/15 bg-white/[0.07] py-2 pl-2 pr-6 text-xs font-bold text-white outline-none focus:border-[#0A84FF]"
            >
              {stationNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-2.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span className="text-[11px] font-medium text-white">도착 마감한계:</span>
        </div>
        <input
          id="deadline-time-input"
          type="time"
          value={deadlineTime}
          onChange={(event) => onChangeDeadlineTime(event.target.value)}
          className="focus-ring rounded-lg border border-white/10 bg-white/[0.07] px-2 py-0.5 font-mono text-xs font-bold text-white outline-none focus:border-[#0A84FF]"
        />
      </div>
    </div>
  );
}
