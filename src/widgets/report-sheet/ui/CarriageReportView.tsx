import type { CarDetail } from "../../../entities/route-plan";

type CarriageReportViewProps = {
  carDetails: CarDetail[];
  activeCarNo: string;
  startStation: string;
  endStation: string;
  onSelectCar: (carNo: string) => void;
};

const getComfortClassName = (comfortRating: CarDetail["comfortRating"]) => {
  if (comfortRating === "안전") return "bg-[#0A84FF]/10 text-[#0A84FF]";
  if (comfortRating === "주의") return "bg-[#FF9500]/10 text-[#FF9500]";
  return "bg-[#FF3B30]/10 text-[#FF3B30]";
};

const getCarButtonClassName = (car: CarDetail, isActive: boolean) => {
  if (isActive) return "bg-[#0A84FF]/10 border-[#0A84FF] text-white shadow-[0_2px_10px_rgba(166,214,0,0.2)]";
  if (car.comfortRating === "안전") return "apple-glass border-white/10 text-[#0A84FF]";
  if (car.comfortRating === "주의") return "apple-glass border-white/10 text-[#FF9500]";
  return "apple-glass border-white/10 text-[#FF3B30]";
};

export function CarriageReportView({ carDetails, activeCarNo, startStation, endStation, onSelectCar }: CarriageReportViewProps) {
  const activeCar = carDetails.find((car) => car.carNo === activeCarNo);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold border-b border-white/15 pb-2 text-white">
        <span>최한산 안심 탑승 칸 추천 ({startStation} → {endStation})</span>
        <span className="text-[#FF3B30] text-[11px] font-mono">급행 혼잡도: 극심</span>
      </div>

      <div className="flex justify-between gap-1 py-1">
        {carDetails.map((car) => {
          const isActive = activeCarNo === car.carNo;

          return (
            <button
              key={car.carNo}
              onClick={() => onSelectCar(car.carNo)}
              className={`flex-1 py-1.5 rounded-lg border text-center transition-all ${getCarButtonClassName(car, isActive)}`}
            >
              <span className="text-[10px] uppercase font-bold tracking-tight block">{car.carNo}</span>
              <span className="text-[7.5px] font-mono block opacity-80">{car.crowdPercent}%</span>
            </button>
          );
        })}
      </div>

      {activeCar && (
        <div className="apple-glass border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#0A84FF]">카 {activeCarNo} 상태분석</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getComfortClassName(activeCar.comfortRating)}`}>
              {activeCar.comfortRating} 보장
            </span>
          </div>

          <p className="text-[11px] text-white/70 leading-relaxed">
            {activeCar.reason}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50 border-t border-white/15 pt-2">
            <span>출구 거리: {activeCar.transferStatus === "fast" ? "초단거리 (4-2)" : "도보 50m"}</span>
            <span className="text-right">체력생존율: {activeCar.comfortRating === "안전" ? "95%" : "30%"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
