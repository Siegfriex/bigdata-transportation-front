import { Bike, ShieldCheck } from "lucide-react";
import { stationNames } from "../../../entities/station";
import type { UserPreferences } from "../../../entities/user-preferences";
import {
  aiStyleOptions,
  publicDataSourceNotice,
  taxiFeeOptions,
  walkLimitOptions,
} from "../model/config";

type SettingsFormProps = {
  preferences: UserPreferences;
  onChangePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onSyncRoutine: () => void;
  onShowToast: (message: string) => void;
};

type CrowdSensitivity = UserPreferences["crowdSensitivity"];

const isCrowdSensitivity = (value: string): value is CrowdSensitivity =>
  value === "low" || value === "normal" || value === "high";

export function SettingsForm({
  preferences,
  onChangePreferences,
  onSyncRoutine,
  onShowToast,
}: SettingsFormProps) {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto absolute inset-0 z-10 bg-black/80 backdrop-blur-3xl pointer-events-auto">
      <div className="space-y-2.5">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">루틴 지점 입력</span>
        <div className="apple-glass border border-white/10 rounded-2xl p-3.5 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-white block">🏠 자택 (기본 출발지)</label>
            <select
              value={preferences.home}
              onChange={(event) => onChangePreferences((prev) => ({ ...prev, home: event.target.value }))}
              className="w-full apple-glass-light border border-white/15 rounded-xl py-2 px-3 text-xs text-white"
            >
              {stationNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white block">🏢 회사 / 학교 (기본 목적지)</label>
            <select
              value={preferences.work}
              onChange={(event) => onChangePreferences((prev) => ({ ...prev, work: event.target.value }))}
              className="w-full apple-glass-light border border-white/15 rounded-xl py-2 px-3 text-xs text-white"
            >
              {stationNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onSyncRoutine}
            className="w-full py-2 bg-[#0A84FF] text-white rounded-xl text-xs font-bold transition-transform active:scale-95"
          >
            기본 루틴으로 지도 동기화
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">세부 이동 조건</span>
        <div className="apple-glass border border-white/10 rounded-2xl overflow-hidden divide-y divide-[#25282B]">
          <div className="p-3">
            <label className="flex justify-between items-center text-xs text-white">
              <span>택시 선탑승 최대 요금 상한</span>
              <select
                value={preferences.maxTaxiFee}
                onChange={(event) => onChangePreferences((prev) => ({ ...prev, maxTaxiFee: Number(event.target.value) }))}
                className="apple-glass-light text-[#0A84FF] text-[11px] font-mono px-2 py-1 outline-none rounded border border-white/10"
              >
                {taxiFeeOptions.map((fee) => (
                  <option key={fee} value={fee}>{fee === 0 ? "0원 (이용 안함)" : fee === 100000 ? "제한 없음" : `${fee.toLocaleString()}원`}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="p-3">
            <label className="flex justify-between items-center text-xs text-white">
              <span>환승 시 도보 허용 시간</span>
              <select
                value={preferences.walkLimitMin}
                onChange={(event) => onChangePreferences((prev) => ({ ...prev, walkLimitMin: Number(event.target.value) }))}
                className="apple-glass-light text-[#0A84FF] text-[11px] font-mono px-2 py-1 outline-none rounded border border-white/10"
              >
                {walkLimitOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>{minutes}분 이하</option>
                ))}
              </select>
            </label>
          </div>
          <div className="p-3">
            <label className="flex justify-between items-center text-xs text-white">
              <span>혼잡 회피 민감도</span>
              <select
                value={preferences.crowdSensitivity}
                onChange={(event) => {
                  if (isCrowdSensitivity(event.target.value)) {
                    onChangePreferences((prev) => ({ ...prev, crowdSensitivity: event.target.value }));
                  }
                }}
                className="apple-glass-light text-[#0A84FF] text-[11px] px-2 py-1 outline-none rounded border border-white/10"
              >
                <option value="low">낮음 (경로 우선)</option>
                <option value="normal">보통</option>
                <option value="high">높음 (쾌적함 우선)</option>
              </select>
            </label>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="flex gap-1.5 items-center">
              <Bike className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span className="text-xs text-white">자전거(따릉이) 연계 사용</span>
            </div>
            <button
              onClick={() => onChangePreferences((prev) => ({ ...prev, useBike: !prev.useBike }))}
              className={`w-10 h-5 rounded-full transition-all relative outline-none ${
                preferences.useBike ? "bg-[#0A84FF]" : "bg-white/20"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                preferences.useBike ? "left-[21px]" : "left-[3px]"
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">AI 챗봇 브리핑 스타일</span>
        <div className="apple-glass border border-white/10 rounded-2xl p-2 flex gap-1">
          {aiStyleOptions.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                onChangePreferences((prev) => ({ ...prev, aiStyle: style.id }));
                onShowToast(`AI 응답 스타일을 '${style.label}'로 변경했습니다.`);
              }}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg border transition-all ${
                preferences.aiStyle === style.id
                  ? "bg-[#0A84FF]/10 border-[#0A84FF] text-[#0A84FF]"
                  : "bg-transparent border-transparent text-white/50 hover:text-white"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">공공데이터 예측 출처 안내</span>
        <div className="apple-glass border border-white/10 rounded-2xl p-3.5 space-y-2 text-[10.5px] leading-relaxed text-white/70">
          <div className="flex items-center justify-between border-b border-white/15 pb-1.5 text-white">
            <span className="font-bold font-sans">{publicDataSourceNotice.heading}</span>
            <span className="text-[#0A84FF] text-[10px] font-mono">{publicDataSourceNotice.statusLabel}</span>
          </div>
          <ul className="list-disc pl-4 space-y-1">
            {publicDataSourceNotice.items.map((item) => (
              <li key={item.label}><strong>{item.label}</strong>: {item.source}</li>
            ))}
          </ul>
          <div className="apple-glass-light p-2 rounded-lg text-[9.5px] font-mono text-white/50 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>{publicDataSourceNotice.disclaimer}</span>
          </div>
        </div>
      </div>

      <div className="text-center pt-2 space-y-1">
        <span className="text-[10px] text-white/50 font-mono block">탈수있나 Metropolitan FSD Platform v0.1</span>
        <span className="text-[9px] text-white/50 font-mono block">국토교통 공공 데이터 활용 경진대비 출품작</span>
      </div>
    </div>
  );
}
