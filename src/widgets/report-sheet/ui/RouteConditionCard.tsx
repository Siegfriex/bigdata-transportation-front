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
    <div className="apple-glass rounded-2xl border border-white/10 p-3 space-y-3 shadow-md relative pointer-events-auto">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-wider block">출발지</label>
          <div className="relative">
            <select
              id="start-station-select"
              value={startStation}
              onChange={(event) => onChangeStartStation(event.target.value)}
              className="w-full apple-glass-light border border-white/15 focus:border-[#0A84FF] rounded-xl py-2 pl-2 pr-6 text-xs text-white uppercase font-bold outline-none appearance-none"
            >
              {stationNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-2.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-wider block">도착지</label>
          <div className="relative">
            <select
              id="end-station-select"
              value={endStation}
              onChange={(event) => onChangeEndStation(event.target.value)}
              className="w-full apple-glass-light border border-white/15 focus:border-[#0A84FF] rounded-xl py-2 pl-2 pr-6 text-xs text-white uppercase font-bold outline-none appearance-none"
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
          className="apple-glass-light border border-white/10 text-xs font-mono font-bold rounded-lg px-2 py-0.5 text-white outline-none focus:border-[#0A84FF]"
        />
      </div>
    </div>
  );
}
