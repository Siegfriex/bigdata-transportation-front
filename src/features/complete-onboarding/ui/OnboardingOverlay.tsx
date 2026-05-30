import { ArrowRight, Bike, CheckCircle2, Sliders, Train } from "lucide-react";
import type { UserPreferences } from "../../../entities/user-preferences";
import { TalsuLogo } from "../../../shared/ui/brand/TalsuLogo";

type UserProfile = {
  name: string;
  isLoggedIn: boolean;
};

type CrowdSensitivity = UserPreferences["crowdSensitivity"];

type OnboardingOverlayProps = {
  step: number;
  user: UserProfile;
  preferences: UserPreferences;
  onNext: () => void;
  onBypass: () => void;
  onChangeUser: (updater: (prev: UserProfile) => UserProfile) => void;
  onChangePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onFinish: () => void;
};

const crowdSensitivityOptions: Array<{ value: CrowdSensitivity; label: string }> = [
  { value: "low", label: "낮음" },
  { value: "normal", label: "보통" },
  { value: "high", label: "높음" },
];

const maxTaxiFeeOptions = [0, 5000, 10000];

export function OnboardingOverlay({
  step,
  user,
  preferences,
  onNext,
  onBypass,
  onChangeUser,
  onChangePreferences,
  onFinish,
}: OnboardingOverlayProps) {
  return (
    <div className="z-layer-onboarding absolute inset-0 flex flex-col overflow-y-auto bg-black/55 p-6 backdrop-blur-3xl">
      {step === 1 ? (
        <div className="flex-1 flex flex-col justify-between py-8">
          <div className="space-y-4 text-center mt-12">
            <div className="surface-card mx-auto flex h-[104px] w-[188px] items-center justify-center rounded-[22px] bg-white px-5 shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
              <TalsuLogo
                className="w-full"
                state="go"
                interactive
                ariaLabel="탈수있나 첫 화면 로고"
              />
            </div>
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white mt-6">
              빠른 길 말고,<br />
              <span className="text-[#0A84FF]">실제로 탈 수 있는 안심 길</span>
            </h1>
            <p className="text-[13px] text-white/60 max-w-[280px] mx-auto leading-relaxed mt-3">
              수도권 버스 잔여좌석, 지하철 혼잡도, 따릉이 결합 전술을 계산해 안심 도착을 보장합니다.
            </p>
          </div>

          <div className="surface-card stack-md my-8 p-5">
            <div className="flex items-center justify-between text-[11px] font-medium text-white/50">
              <span>Status: Ready</span>
              <span>Transit MaaS</span>
            </div>
            <div className="space-y-2">
              <div className="text-[13px] font-semibold flex items-center gap-2 text-white">
                <Train className="w-4 h-4 text-[#0A84FF]" />
                <span>염창역 → 여의도역 (9호선 급행)</span>
              </div>
              <div className="text-[11px] text-white/60 pl-6">지하철 계단 몰림 피로 회피 전술 장착</div>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-4">
              <div className="h-full w-2/3 bg-[#0A84FF] rounded-full shadow-[0_0_12px_rgba(10,132,255,0.8)]" />
            </div>
          </div>

          <div className="space-y-3">
            <button
              id="next-onboarding"
              onClick={onNext}
              className="control-base focus-ring flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#0A84FF] py-4 text-[15px] font-semibold text-white shadow-lg hover:bg-[#007AFF]"
            >
              <span>조건 설정 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="bypass-login"
              onClick={onBypass}
              className="control-base focus-ring w-full rounded-[18px] bg-transparent py-3 text-[13px] font-medium text-white/50 hover:text-white"
            >
              비회원으로 바로 둘러보기
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between py-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mt-8">
              <Sliders className="w-5 h-5 text-[#0A84FF]" />
              <h2 className="text-sm font-semibold text-white">초기 개인 이동선호 설정 (AUTH-04)</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-white/50 tracking-wide mb-2">혼잡 민감도 (회피 강도)</label>
                <div className="grid grid-cols-3 gap-2">
                  {crowdSensitivityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onChangePreferences((prev) => ({ ...prev, crowdSensitivity: option.value }))}
                      className={`control-base focus-ring rounded-xl px-1 py-2 text-center text-[13px] font-medium ${
                        preferences.crowdSensitivity === option.value
                          ? "bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/20"
                          : "apple-glass-light text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/50 tracking-wide mb-2">택시 선탑승 상한 비용</label>
                <div className="grid grid-cols-3 gap-2">
                  {maxTaxiFeeOptions.map((fee) => (
                    <button
                      key={fee}
                      onClick={() => onChangePreferences((prev) => ({ ...prev, maxTaxiFee: fee }))}
                      className={`control-base focus-ring rounded-xl px-1 py-2 text-center text-[13px] font-medium ${
                        preferences.maxTaxiFee === fee
                          ? "bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/20"
                          : "apple-glass-light text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {fee === 0 ? "사용 안함" : `${fee.toLocaleString()}원`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/50 tracking-wide mb-2">따릉이 자전거 연계</label>
                <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.07] p-3">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-[#0A84FF]" />
                    <span className="text-[13px] text-white">경로에 자전거 조합 포함</span>
                  </div>
                  <button
                    onClick={() => onChangePreferences((prev) => ({ ...prev, useBike: !prev.useBike }))}
                    className={`focus-ring relative h-[28px] w-[46px] rounded-full transition-all duration-300 ${
                      preferences.useBike ? "bg-[#0A84FF]" : "bg-white/10"
                    }`}
                  >
                    <div className={`w-[24px] h-[24px] rounded-full bg-white shadow-sm absolute top-[2px] transition-all duration-300 ${
                      preferences.useBike ? "left-[20px]" : "left-[2px]"
                    }`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/50 tracking-wide mb-2">상용 닉네임 설정</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(event) => onChangeUser((prev) => ({ ...prev, name: event.target.value }))}
                  className="focus-ring w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-[14px] text-white outline-none transition-all duration-200 focus:bg-white/10"
                  placeholder="이름을 입력하세요"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <button
              id="finish-onboarding"
              onClick={onFinish}
              className="control-base focus-ring flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#0A84FF] py-4 text-[15px] font-semibold text-white shadow-lg hover:bg-[#007AFF]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>개인 플랜 분석 시작</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-1.5 mt-4">
        <span className={`w-1.5 h-1.5 rounded-full ${step === 1 ? "bg-white" : "bg-white/20"}`} />
        <span className={`w-1.5 h-1.5 rounded-full ${step === 2 ? "bg-white" : "bg-white/20"}`} />
      </div>
    </div>
  );
}
