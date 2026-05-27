import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Map,
  MessageSquare,
  FileText,
  Sliders,
  ChevronRight,
  ArrowRight,
  Navigation,
  Sparkles,
  Train,
  Bike,
  AlertTriangle,
  Bookmark,
  Plus,
  Compass,
  CheckCircle2,
  BookmarkCheck,
  RotateCw,
  Search,
  User,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Calendar,
  Layers,
  Clock,
  Car,
  Bus,
  Footprints,
  Copy
} from "lucide-react";
import { TabId, ReportType, RoutePlan, SavedReport, UserPreferences, ChatMessage } from "./types";
import { getDefaultPreferences, getSavedReportsMock, getRoutePlans, getCarSurvivalDetails, CarDetail } from "./data";
import { routePresets, type RoutePreset } from "./features/generate-route-plan";
import { createSavedReport, isDuplicateSavedReport } from "./features/save-report";
import { createFallbackChatMessage, renderMarkdown, sendAiChat } from "./features/send-ai-chat";
import { DEFAULT_VISIBLE_LAYERS, type MapLayerState } from "./features/toggle-map-layer";
import { STORAGE_KEYS } from "./shared/config";
import { formatKoreanTime } from "./shared/lib/time";
import { usePersistentState } from "./shared/model/usePersistentState";
import InteractiveMap from "./components/InteractiveMap";

export default function App() {
  // Onboarding / Profile State Check
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [user, setUser] = useState<{ name: string; isLoggedIn: boolean }>({
    name: "김도윤",
    isLoggedIn: false,
  });

  // Global Navigation State
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [mapLayer, setMapLayer] = useState<MapLayerState>("default");

  // Routing State Presets (Matching PRD scenarios)
  const [startStation, setStartStation] = useState<string>("염창역");
  const [endStation, setEndStation] = useState<string>("여의도역");
  const [deadlineTime, setDeadlineTime] = useState<string>("09:00");
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("deadline");

  // Route Customizer States
  const [preferences, setPreferences] = usePersistentState<UserPreferences>(
    STORAGE_KEYS.preferences,
    getDefaultPreferences()
  );
  const [savedReports, setSavedReports] = usePersistentState<SavedReport[]>(
    STORAGE_KEYS.savedReports,
    getSavedReportsMock()
  );

  // Layer togglers passed down to InteractiveMap
  const [visibleLayers, setVisibleLayers] = useState(DEFAULT_VISIBLE_LAYERS);

  // Derived Route Plans list from data engine
  const [plans, setPlans] = useState<RoutePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RoutePlan | null>(null);

  // Active highlighted Subway carriage for carriage survival guide
  const [activeCarNo, setActiveCarNo] = useState<string>("3-3");
  const [carDetails, setCarDetails] = useState<CarDetail[]>([]);

  // Active selected Date for calendar commute tracker
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(26);

  // AI Chat states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatbotLoading, setChatbotLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "👋 반갑습니다! 수도권 실시간 혼잡도 및 생존 이동 플랜 분석기 **'탈수있나'**입니다.\n\n현재 출발지 **염창역**, 목적지 **여의도역**으로 통학/통근 전술이 실시간 예측되어 있습니다. 원하시는 리포트 카드를 조회하시거나 아래 추천 프롬프트를 클릭하세요!",
      timestamp: "오전 08:31",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast State for actions on screen
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Memoized route calculation callback to prevent redundant map updates
  const updateRoutePlans = useCallback(() => {
    console.log("[RouteSync] recalculating routes due to dependency change:", { startStation, endStation, useBike: preferences.useBike, maxTaxiFee: preferences.maxTaxiFee });
    const calculatedPlans = getRoutePlans(startStation, endStation, {
      useBike: preferences.useBike,
      maxTaxiFee: preferences.maxTaxiFee,
    });
    setPlans(calculatedPlans);
    
    // Only auto-select the first plan if we don't already have a valid selection for these routes
    setSelectedPlan((prev) => {
      if (prev && calculatedPlans.some(p => p.id === prev.id)) {
        return calculatedPlans.find(p => p.id === prev.id)!;
      }
      return calculatedPlans[0] || null;
    });
    
    // Automatically select best report type fitting the scenario
    if (startStation === "사당역") {
      setSelectedReportType("boarding");
    } else if (startStation === "홍대입구역") {
      setSelectedReportType("recovery");
    } else {
      setSelectedReportType("deadline");
    }
  }, [startStation, endStation, preferences.useBike, preferences.maxTaxiFee]);

  // Sync route plans when stations or preferences change
  useEffect(() => {
    updateRoutePlans();
  }, [updateRoutePlans]);

  // Sync Subway Carriage comfort ratings
  useEffect(() => {
    setCarDetails(getCarSurvivalDetails("9호선"));
  }, []);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleToggleLayer = useCallback((layer: "subway" | "bus" | "bike" | "crowd") => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleSelectStation = useCallback((type: "start" | "end", name: string) => {
    if (type === "start") setStartStation(name);
    else setEndStation(name);
  }, []);

  // Preset trigger helper
  const triggerPreset = (preset: RoutePreset) => {
    setStartStation(preset.start);
    setEndStation(preset.end);
    setSelectedReportType(preset.report);
    if (preset.time) setDeadlineTime(preset.time);
    showToast(`📍 '${preset.title}' 비상 시나리오가 로드되었습니다.`);
    setMapLayer("report_detail");
  };

  // Submit dynamic AI chat
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || chatbotLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: formatKoreanTime(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatbotLoading(true);

    try {
      const data = await sendAiChat({
        message: text,
        context: {
          startStation,
          endStation,
          deadlineTime,
          preferences,
        },
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: data.textAnswer,
        timestamp: formatKoreanTime(),
        suggestedReportType: data.suggestedReportType,
        startStation: data.startStation,
        endStation: data.endStation,
        recommendedCarNo: data.recommendedCarNo,
        routeIndex: data.routeIndex,
      };

      setChatMessages((prev) => [...prev, aiMsg]);

      let newStart = startStation;
      let newEnd = endStation;

      if (data.startStation) {
        newStart = data.startStation;
        setStartStation(data.startStation);
      }
      if (data.endStation) {
        newEnd = data.endStation;
        setEndStation(data.endStation);
      }
      if (data.suggestedReportType) {
        setSelectedReportType(data.suggestedReportType);
      }
      if (data.recommendedCarNo) {
        setActiveCarNo(data.recommendedCarNo);
      }

      const nextPlans = getRoutePlans(newStart, newEnd, {
        useBike: preferences.useBike,
        maxTaxiFee: preferences.maxTaxiFee
      });

      if (data.routeIndex !== undefined && nextPlans[data.routeIndex]) {
        setSelectedPlan(nextPlans[data.routeIndex]);
      }

      showToast("💡 AI가 지도를 분석하여 전술 경로를 업데이트했습니다.");
      setChatbotLoading(false);
      setMapLayer("ai_result");
    } catch (err) {
      setTimeout(() => {
        const fallbackMsg = createFallbackChatMessage(text);
        setChatMessages((prev) => [...prev, fallbackMsg]);
        if (fallbackMsg.suggestedReportType) {
          setSelectedReportType(fallbackMsg.suggestedReportType);
        }
        if (fallbackMsg.suggestedReportType === "carriage") {
          setActiveCarNo("3-3");
        }
        setChatbotLoading(false);
        setMapLayer("ai_result");
      }, 700);
    }
  };

  // Save current route plan as report
  const handleSaveReport = () => {
    if (!selectedPlan) return;
    const isExist = isDuplicateSavedReport(savedReports, {
      from: startStation,
      to: endStation,
      type: selectedReportType,
    });
    if (isExist) {
      showToast("이미 보관함에 물리 장착된 리포트입니다.");
      return;
    }

    const newReport = createSavedReport({
      selectedPlan,
      selectedReportType,
      startStation,
      endStation,
    });

    setSavedReports((prev) => [newReport, ...prev]);
    showToast("💾 통근 리포트가 보관함에 영구 저장되었습니다.");
  };

  return (
    <div className="min-h-screen bg-black apple-mesh-bg text-[#FFFFFF] font-sans antialiased flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-x-hidden">
      
      {/* Absolute Dynamic Floating Action Alerts / Toast Notification */}
      {toastMessage && (
        <div id="toast-overlay" className="fixed top-5 left-1/2 -translate-x-1/2 apple-glass text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-[0_12px_24px_rgba(0,0,0,0.5)] z-[100] flex items-center gap-1.5 animate-in fade-in slide-in-from-top-6 duration-200">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#0A84FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen container: Styled like a high-density, glassmorphic premium physical phone chassis on desktop view! */}
      <div className="w-full max-w-[412px] h-screen md:h-[844px] apple-glass rounded-none md:rounded-[44px] border-none md:border-[8px] md:border-[#1E1E1E]/80 shadow-[0_32px_64px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden">
        
        {/* Mock notch / camera indicator inside device */}
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-7 bg-black rounded-b-3xl z-40 items-center justify-center shadow-lg">
          <div className="w-3 h-3 rounded-full bg-[#111111] border border-[#222] mr-3 shadow-inner" />
          <div className="w-12 h-1.5 bg-[#444] rounded-full" />
        </div>

        {/* AUTH Flow Overlays (Onboarding AUTH-01 & AUTH-02 login) */}
        {showOnboarding && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl z-40 flex flex-col p-6 overflow-y-auto">
            {onboardingStep === 1 ? (
              <div className="flex-1 flex flex-col justify-between py-8">
                <div className="space-y-4 text-center mt-12">
                  <div className="w-20 h-20 apple-glass-light rounded-[28px] border border-white/20 flex items-center justify-center mx-auto text-white shadow-xl">
                    <Compass className="w-10 h-10 animate-spin-slow" />
                  </div>
                  <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white mt-6">
                    빠른 길 말고,<br />
                    <span className="text-[#0A84FF]">실제로 탈 수 있는 안심 길</span>
                  </h1>
                  <p className="text-[13px] text-white/60 max-w-[280px] mx-auto leading-relaxed mt-3">
                    수도권 버스 잔여좌석, 지하철 혼잡도, 따릉이 결합 전술을 계산해 안심 도착을 보장합니다.
                  </p>
                </div>

                {/* Styled Low-Saturation Route Preview Graphic */}
                <div className="my-8 apple-glass p-5 rounded-[24px] shadow-lg space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-medium text-white/50 tracking-wide uppercase">
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
                    onClick={() => setOnboardingStep(2)}
                    className="w-full py-4 bg-[#0A84FF] hover:bg-[#007AFF] text-white rounded-[20px] text-[15px] font-semibold transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>조건 설정 시작하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    id="bypass-login"
                    onClick={() => {
                        setUser({ name: "비회원 체험자", isLoggedIn: false });
                        setShowOnboarding(false);
                        showToast("비회원 체험 모드로 진입했습니다.");
                    }}
                    className="w-full py-3 bg-transparent text-white/50 hover:text-white rounded-[20px] text-[13px] font-medium transition-colors"
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
                        {["low", "normal", "high"].map((level) => (
                          <button
                            key={level}
                            onClick={() => setPreferences(prev => ({ ...prev, crowdSensitivity: level as any }))}
                            className={`py-2 px-1 text-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
                              preferences.crowdSensitivity === level
                                ? "bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/20"
                                : "apple-glass-light text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {level === "low" ? "낮음" : level === "normal" ? "보통" : "높음"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-white/50 tracking-wide mb-2">택시 선탑승 상한 비용</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 5000, 10000].map((fee) => (
                          <button
                            key={fee}
                            onClick={() => setPreferences(prev => ({ ...prev, maxTaxiFee: fee }))}
                            className={`py-2 px-1 text-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
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
                      <div className="flex items-center justify-between p-3 apple-glass-light rounded-xl">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-[#0A84FF]" />
                          <span className="text-[13px] text-white">경로에 자전거 조합 포함</span>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, useBike: !prev.useBike }))}
                          className={`w-[46px] h-[28px] rounded-full transition-all duration-300 relative ${
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
                        onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full apple-glass-light focus:bg-white/10 focus:border-white/30 rounded-xl py-3 px-4 text-[14px] text-white outline-none font-sans transition-all duration-200"
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <button
                    id="finish-onboarding"
                    onClick={() => {
                      setUser(prev => ({ ...prev, isLoggedIn: true }));
                      setShowOnboarding(false);
                      showToast(`환영합니다, ${user.name}님! 설정이 성공 탑재되었습니다.`);
                    }}
                    className="w-full py-4 bg-[#0A84FF] hover:bg-[#007AFF] transition-colors shadow-lg text-white rounded-[20px] text-[15px] font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>개인 플랜 분석 시작</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Onboarding steps paginator dot row */}
            <div className="flex justify-center gap-1.5 mt-4">
              <span className={`w-1.5 h-1.5 rounded-full ${onboardingStep === 1 ? "bg-white" : "bg-white/20"}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${onboardingStep === 2 ? "bg-white" : "bg-white/20"}`} />
            </div>
          </div>
        )}

        {/* MAP LAYER (Z0) - Always Active & Full Screen */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <InteractiveMap
            startStation={startStation}
            endStation={endStation}
            onSelectStation={handleSelectStation}
            selectedPlan={selectedPlan}
            visibleLayers={visibleLayers}
            onToggleLayer={handleToggleLayer}
          />
        </div>

        {/* Global Standard Top App Bar (STATUS & NAVIGATION INFO) */}
        <header className="absolute top-0 inset-x-0 px-4 py-3 apple-glass border-b border-white/10 flex items-center justify-between z-20 shrink-0 select-none pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-mono font-black tracking-widest text-[#0A84FF] uppercase flex items-center gap-1">
              <span>탈수있나</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 apple-glass-light border border-white/10 px-2 py-1 rounded-lg text-[9px] text-white/70">
              <User className="w-3 h-3 text-[#0A84FF]" />
              <span className="truncate max-w-[50px] font-mono">{user.name}</span>
            </div>
            
            {showOnboarding === false && (
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-[9px] font-mono text-white/50 border border-transparent hover:border-white/10 px-1.5 py-0.5 rounded transition-all"
              >
                RESET
              </button>
            )}
          </div>
        </header>

        {/* Primary Screen Body Panel */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 relative z-10 pt-[52px] pointer-events-none pb-[64px]">
          
          {/* TAB 1: 의사결정 시트 (Main Map Action Sheet) */}
          {activeTab === "map" && (
            <div className="flex-1 flex flex-col p-3 pt-4 space-y-3 pointer-events-none justify-start">
              
              <div className="flex-1 shrink-0 min-h-[40px]"></div>

              {/* Routing Preset Information Cards Carousel */}
              <div className="w-full overflow-x-auto scrollbar-none pb-2 flex gap-3 pointer-events-auto snap-x">
                {routePresets.map((preset, idx) => {
                  const isActive = startStation === preset.start && endStation === preset.end && selectedReportType === preset.report;
                  const urgencyColors = preset.urgency === "high" ? "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/30" : preset.urgency === "warn" ? "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/30" : "text-[#A6D600] bg-[#A6D600]/10 border-[#A6D600]/30";
                  return (
                    <button
                      key={idx}
                      onClick={() => triggerPreset(preset)}
                      className={`shrink-0 w-[180px] snap-center text-left p-3 rounded-[16px] border transition-all flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                        isActive
                          ? "bg-[#0A84FF]/10 border-[#0A84FF]/50 shadow-[0_4px_16px_rgba(10,132,255,0.2)]"
                          : "apple-glass border-white/10 hover:border-white/20 hover:bg-white/5 active:scale-[0.98]"
                      }`}
                    >
                      {isActive && <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent pointer-events-none" />}
                      <div className="flex items-start justify-between w-full">
                         <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${isActive ? 'text-white bg-[#0A84FF]' : urgencyColors}`}>
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

              {mapLayer === "default" && (
                <div 
                  className="apple-glass rounded-2xl border border-white/10 p-3 shadow-md relative pointer-events-auto flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setMapLayer("ai_overlay")}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-white/50" />
                    <span className="text-white/50 font-medium text-sm">어디까지 가나요? (AI에게 묻기)</span>
                  </div>
                  <Sparkles className="w-5 h-5 text-[#0A84FF]" />
                </div>
              )}

              {mapLayer === "report_detail" && (
              <>
                <div className="flex justify-between items-center px-1 pointer-events-auto">
                  <span className="font-bold text-white text-sm">리포트 상세</span>
                  <button onClick={() => setMapLayer("default")} className="text-white/50 hover:text-white p-1">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                {/* Input Station Settings Sheet Card (MAP-02) */}
                <div className="apple-glass rounded-2xl border border-white/10 p-3 space-y-3 shadow-md relative pointer-events-auto">
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-wider block">출발 정박사</label>
                    <div className="relative">
                      <select
                        id="start-station-select"
                        value={startStation}
                        onChange={(e) => setStartStation(e.target.value)}
                        className="w-full apple-glass-light border border-white/15 focus:border-[#0A84FF] rounded-xl py-2 pl-2 pr-6 text-xs text-white uppercase font-bold outline-none appearance-none"
                      >
                        {["염창역", "여의도역", "사당역", "강남역", "구리역", "홍대입구역", "남양주시"].map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-2.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-wider block">목적 대피지</label>
                    <div className="relative">
                      <select
                        id="end-station-select"
                        value={endStation}
                        onChange={(e) => setEndStation(e.target.value)}
                        className="w-full apple-glass-light border border-white/15 focus:border-[#0A84FF] rounded-xl py-2 pl-2 pr-6 text-xs text-white uppercase font-bold outline-none appearance-none"
                      >
                        {["염창역", "여의도역", "사당역", "강남역", "구리역", "홍대입구역", "남양주시"].map((name) => (
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
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="apple-glass-light border border-white/10 text-xs font-mono font-bold rounded-lg px-2 py-0.5 text-white outline-none focus:border-[#0A84FF]"
                  />
                </div>
              </div>

              {/* Tab Selector inside the Sheet for Reports (MAP-05, MAP-06, MAP-07, MAP-08) */}
              <div className="space-y-2 pointer-events-auto bg-black/40 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
                <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none">
                  {([
                    { id: "deadline", label: "⏱️ 마감도착" },
                    { id: "boarding", label: "🚍 탑승가능" },
                    { id: "carriage", label: "🚇 생존 칸" },
                    { id: "recovery", label: "🌙 실패복구" }
                  ] as const).map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => {
                        setSelectedReportType(rep.id);
                        showToast(`📊 '${rep.label.split(" ")[1]}' 분석 보고서가 로딩되었습니다.`);
                      }}
                      className={`flex-1 min-w-[70px] py-2 text-center text-xs font-bold transition-all relative shrink-0 ${
                        selectedReportType === rep.id
                          ? "text-[#0A84FF]"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      <span>{rep.label}</span>
                      {selectedReportType === rep.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A84FF]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* ACTIVE REPORT CONTAINER */}
                <div id="active-report-view" className="apple-glass rounded-2xl border border-white/10 p-3 space-y-3.5">
                  
                  {/* F1: 탑승가능성 리포트 (Boarding Possibility Report MAP-05) */}
                  {selectedReportType === "boarding" && (
                    <div className="space-y-3">
                      <div className="bg-[#FF9500]/10 border border-[#FF9500]/25 rounded-xl p-3 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#FF9500] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-[#FF9500] mb-0.5">이번 차량은 보내는 편이 안전합니다!</h4>
                          <p className="text-[10px] text-white/70 leading-relaxed">
                            {startStation} 부근 광역버스 배차진단 결과, 현재 기점 출발 인원이 만석으로 입점 정체 및 무정차가 예상됩니다.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="apple-glass border border-white/10 p-2.5 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-white/50 font-mono block uppercase">이번 차량 (1st Bus)</span>
                          <span className="text-sm font-black text-[#FF3B30] tracking-tight">3분 후 진입</span>
                          <span className="text-[10px] bg-[#FF3B30]/15 text-[#FF3B30] px-1.5 py-0.5 rounded-full inline-block font-mono">만석 (잔여 0석)</span>
                          <span className="text-[9px] text-white/50 block">차내혼잡: 최고조</span>
                        </div>
                        <div className="apple-glass border border-[#0A84FF]/30 p-2.5 rounded-xl text-center space-y-1 shadow-[0_4px_12px_rgba(10,132,255,0.15)]">
                          <span className="text-[10px] text-[#0A84FF] font-mono block uppercase">다음 차량 (2nd Bus)</span>
                          <span className="text-sm font-black text-[#0A84FF] tracking-tight">8분 후 진입</span>
                          <span className="text-[10px] bg-[#0A84FF]/15 text-[#0A84FF] px-1.5 py-0.5 rounded-full inline-block font-mono">원활 (잔여 13석)</span>
                          <span className="text-[9px] text-white/70 block">좌석착정: 92% 보장</span>
                        </div>
                      </div>

                      <div className="border-t border-white/15 pt-2 flex items-center justify-between text-[11px] text-white/70 font-mono">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0A84FF]" />
                          <span>신뢰도: 패턴+실시간 융합</span>
                        </span>
                        <span className="text-[#0A84FF]">다음 차량 착석 권고</span>
                      </div>
                    </div>
                  )}

                  {/* F2: 지하철 칸별 생존 가이드 (Carriage Survival Guide MAP-06) */}
                  {selectedReportType === "carriage" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold border-b border-white/15 pb-2 text-white">
                        <span>🚇 최한산 안심 탑승 칸 추천 (염창역 → 여의도기)</span>
                        <span className="text-[#FF3B30] text-[11px] font-mono">급행 혼잡도: 극심</span>
                      </div>

                      {/* Interactive Subway Carriage row mockup */}
                      <div className="flex justify-between gap-1 py-1">
                        {carDetails.map((car, idx) => (
                          <button
                            key={car.carNo}
                            onClick={() => {
                              setActiveCarNo(car.carNo);
                              showToast(`🚇 ${car.carNo}번 칸 상세 분석을 로드했습니다.`);
                            }}
                            className={`flex-1 py-1.5 rounded-lg border text-center transition-all ${
                              activeCarNo === car.carNo
                                ? "bg-[#0A84FF]/10 border-[#0A84FF] text-white shadow-[0_2px_10px_rgba(166,214,0,0.2)]"
                                : car.comfortRating === "안전"
                                ? "apple-glass border-white/10 text-[#0A84FF]"
                                : car.comfortRating === "주의"
                                ? "apple-glass border-white/10 text-[#FF9500]"
                                : "apple-glass border-white/10 text-[#FF3B30]"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-tight block">{car.carNo}</span>
                            <span className="text-[7.5px] font-mono block opacity-80">{car.crowdPercent}%</span>
                          </button>
                        ))}
                      </div>

                      {/* Detail information card of active selected carriage */}
                      {carDetails.find((c) => c.carNo === activeCarNo) && (
                        <div className="apple-glass border border-white/10 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#0A84FF]">카 {activeCarNo} 상태분석</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              carDetails.find(c => c.carNo === activeCarNo)?.comfortRating === "안전"
                                ? "bg-[#0A84FF]/10 text-[#0A84FF]"
                                : carDetails.find(c => c.carNo === activeCarNo)?.comfortRating === "주의"
                                ? "bg-[#FF9500]/10 text-[#FF9500]"
                                : "bg-[#FF3B30]/10 text-[#FF3B30]"
                            }`}>
                              {carDetails.find(c => c.carNo === activeCarNo)?.comfortRating} 보장
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-white/70 leading-relaxed">
                            {carDetails.find(c => c.carNo === activeCarNo)?.reason}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50 border-t border-white/15 pt-2">
                            <span>출구 거리: {carDetails.find(c => c.carNo === activeCarNo)?.transferStatus === "fast" ? "초단거리 (4-2)" : "도보 50m"}</span>
                            <span className="text-right">체력생존율: {carDetails.find(c => c.carNo === activeCarNo)?.comfortRating === "안전" ? "95%" : "30%"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* F3: 마감도착 리포트 (Deadline Arrival Plan MAP-07) */}
                  {selectedReportType === "deadline" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">마감도착 후보군 비교 ({deadlineTime} 전 도착기준)</span>
                        <span className="text-[10px] bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full font-mono font-bold">도착확률 95%</span>
                      </div>

                      {/* Route Candidates comparative list */}
                      <div className="space-y-2">
                        {plans.map((plan, idx) => {
                          const isSelected = selectedPlan?.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              onClick={() => setSelectedPlan(plan)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "apple-glass border-[#0A84FF]"
                                  : "apple-glass/50 border-white/10 hover:bg-[#202428]"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    plan.risk === "high" ? "bg-[#FF3B30]" : plan.risk === "medium" ? "bg-[#FF9500]" : "bg-[#0A84FF]"
                                  }`} />
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
                                  <span>지연위험: {plan.risk === 'low' ? '낮음' : plan.risk === 'medium' ? '보통' : '높음'}</span>
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
                              onClick={() => {
                                const summary = `[마감도착 비상 탈출 플랜]\n📍 출발: ${startStation}\n🏁 도착: ${endStation}\n⏱ 목표 시간: ${deadlineTime} 전\n\n[선택된 플랜: ${selectedPlan.name}]\n예상 도착 도착: ${selectedPlan.eta}\n추가 요금: ${selectedPlan.extraCost.toLocaleString()}원\n\n[타임라인 상세]\n${selectedPlan.timeline.map((step, idx) => `${idx + 1}. ${step.detail} (${step.duration}분)`).join('\n')}`;
                                navigator.clipboard.writeText(summary);
                                showToast("🔗 경로 요약이 클립보드에 복사되었습니다.");
                              }}
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
                  )}

                  {/* F4: 실패복구 리포트 (Late Night Failure Recovery MAP-08) */}
                  {selectedReportType === "recovery" && (
                    <div className="space-y-3">
                      <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/25 rounded-xl p-3 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-[#FF3B30] mb-0.5">대중교통 단독 복구가 종료되었습니다.</h4>
                          <p className="text-[10px] text-white/70 leading-relaxed">
                            막차가 소진되었으므로, 불필요한 전구간 콜택시 수수료 낭비를 줄이기 위해 심야 연계 분할 전술(N버스 + 단거리 택시)을 가동합니다.
                          </p>
                        </div>
                      </div>

                      <div className="apple-glass border border-white/10 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
                          <span className="text-xs font-bold text-white">N버스 하이브리드 우회 (Plan A)</span>
                          <span className="text-xs font-mono font-black text-[#0A84FF]">12,600원 소요</span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          홍대에서 중랑구 외곽까지 심야 N62번을 이용해 최대한 기동 후, 마지막 4.2km 구간에 한해서만 최소 택시로 복귀합니다.
                        </p>
                        <div className="bg-[#0A84FF]/10 text-[#0A84FF] text-[10px] p-2 rounded-lg font-mono flex justify-between items-center">
                          <span>전구간 택시 대비 비용보전:</span>
                          <strong>₩24,000 절약</strong>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">홍대 부근 24시 안심 대기 거점 (첫차연계)</span>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div className="apple-glass border border-white/10 p-2 rounded-lg flex items-center justify-between">
                            <span className="text-white">🚨 동교치방 안심쉼터</span>
                            <span className="text-[#0A84FF] font-mono">150m</span>
                          </div>
                          <div className="apple-glass border border-white/10 p-2 rounded-lg flex items-center justify-between">
                            <span className="text-white">⚡ 24시 무인 충전룸</span>
                            <span className="text-[#0A84FF] font-mono">320m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational Bottom CTA Bar for saving on-the-spot reports */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    <button
                      id="save-report-action"
                      onClick={handleSaveReport}
                      className="py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>보관함 저장</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("map");
                        setMapLayer("ai_overlay");
                        handleSendMessage(`${startStation}에서 ${endStation} 가는 지각처방 리포트 요약해줘`);
                        showToast("🤖 리포트 근거 조회를 위해 AI 챗봇이 개입합니다.");
                      }}
                      className="py-2.5 bg-[#0A84FF] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI 원인 브리핑</span>
                    </button>
                  </div>

                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* TAB 3: 통근 기록 보관함 & 아카이브 (Report Archive TAB REP-01) */}
          {activeTab === "archive" && (
            <div className="flex-1 flex flex-col p-4 space-y-3 absolute inset-0 z-10 overflow-y-auto bg-black/80 backdrop-blur-3xl pointer-events-auto">
              
              {/* Profile high contrast commute summary */}
              <div className="apple-glass border border-white/10 rounded-2xl p-3 flex justify-between items-center shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-white/50 uppercase">COMMUTING STATS</span>
                  <div className="text-sm font-bold text-white">이번 달 통근 세이프안착율</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#0A84FF] font-mono">92.8%</span>
                </div>
              </div>

              {/* Monthly calendar mockup grid (REP-02) */}
              <div className="apple-glass border border-white/10 rounded-2xl p-3.5 space-y-3 shrink-0">
                <div className="flex justify-between items-center border-b border-white/15 pb-2">
                  <span className="text-xs font-bold font-mono text-white">2026년 5월 통근캘린더</span>
                  <span className="text-[10px] text-[#0A84FF] font-mono">총 {new Set(savedReports.map(r => r.date)).size}일 출근</span>
                </div>

                {/* Grid Header days of week */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-white/50">
                  {["월", "화", "수", "목", "금", "토", "일"].map(d => <span key={d}>{d}</span>)}
                </div>

                {/* Month Days mockup with select status */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const isSelect = selectedCalendarDay === day;
                    const reportsForDay = savedReports.filter(rep => {
                      const match = rep.date.match(/-(\d{2})$/);
                      return match && parseInt(match[1], 10) === day;
                    });
                    
                    let statusColor = "bg-transparent text-white/50";
                    if (reportsForDay.length > 0) {
                      const hasFail = reportsForDay.some(r => r.status === "danger" || r.status === "warning");
                      if (hasFail) {
                        statusColor = "bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30"; // Warning/Late day
                      } else {
                        statusColor = "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30"; // Success safe day
                      }
                    }

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedCalendarDay(day)}
                        className={`py-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isSelect
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#141618] z-10"
                            : ""
                        } ${statusColor}`}
                      >
                        <span>{day}</span>
                        {reportsForDay.length > 0 && (
                          <div className="flex gap-[2px]">
                            {reportsForDay.slice(0, 3).map((r, idx) => (
                              <span key={idx} className={`w-1 h-1 rounded-full ${r.status === 'success' ? 'bg-[#0A84FF]' : 'bg-[#FF3B30]'}`} />
                            ))}
                            {reportsForDay.length > 3 && <span className="w-1 h-1 rounded-full bg-white/50" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Day commute details representation */}
                <div className="apple-glass-light border border-white/15 rounded-xl p-2.5 text-[11px] leading-relaxed">
                  <span className="text-[#0A84FF] font-bold block mb-1">📅 5월 {selectedCalendarDay}일 통근 피드백</span>
                  {(() => {
                    const selectedReports = savedReports.filter(rep => {
                      const match = rep.date.match(/-(\d{2})$/);
                      return match && parseInt(match[1], 10) === selectedCalendarDay;
                    });
                    if (selectedReports.length === 0) {
                      return <span className="text-white/50 block">저장된 통근 리포트가 없습니다.</span>;
                    }
                    return (
                      <div className="space-y-1 block">
                        {selectedReports.map(rep => (
                          <span key={rep.id} className={`${rep.status === 'danger' || rep.status === 'warning' ? 'text-[#FF3B30]' : 'text-white/90'} block`}>
                            {rep.summary}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Saved Reports (REP-01 / REP-03) */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block">보관된 최신 안전 리포트</span>
                  <button
                    onClick={() => {
                      setSavedReports([]);
                      showToast("보관함이 완전히 비워졌습니다.");
                    }}
                    className="text-[10px] text-[#FF3B30] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>모두 지우기</span>
                  </button>
                </div>

                {savedReports.length === 0 ? (
                  <div className="apple-glass/40 border border-white/10 p-8 text-center rounded-2xl">
                    <BookmarkCheck className="w-8 h-8 text-[#2D3135] mx-auto mb-2" />
                    <span className="text-xs text-white/50 font-mono block">보관된 안전 리포트가 없습니다.</span>
                  </div>
                ) : (
                  savedReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="apple-glass border border-white/10 rounded-xl p-3 space-y-2 relative"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          rep.status === "success"
                            ? "bg-[#0A84FF]/10 text-[#0A84FF]"
                            : rep.status === "warning"
                            ? "bg-[#FF9500]/10 text-[#FF9500]"
                            : "bg-[#FF3B30]/10 text-[#FF3B30]"
                        }`}>
                          {rep.type === "deadline" ? "마감도착" : rep.type === "carriage" ? "생존칸" : rep.type === "boarding" ? "탑승가능" : "실패복구"}
                        </span>
                        <span className="text-[10px] font-mono text-white/50">{rep.date}</span>
                      </div>

                      <p className="text-xs font-bold text-white">{rep.summary}</p>

                      <div className="flex justify-between items-center text-[10px] font-mono text-white/50 border-t border-white/15 pt-2">
                        <span>출발-도착: {rep.from} ↔ {rep.to}</span>
                        <button
                          onClick={() => {
                            setStartStation(rep.from);
                            setEndStation(rep.to);
                            setSelectedReportType(rep.type);
                            setActiveTab("map");
                            showToast("🗺️ 해당 저장 조건으로 메인 지도를 갱신했습니다.");
                          }}
                          className="text-[#0A84FF] flex items-center gap-1 hover:underline"
                        >
                          <span>지도 이동</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: 환경설정 & 개인 맞춤 (Settings TAB SET-01) */}
          {activeTab === "settings" && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto absolute inset-0 z-10 bg-black/80 backdrop-blur-3xl pointer-events-auto">
              
              {/* Routine Location Editor (SET-02) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">루틴 지점 입력</span>
                <div className="apple-glass border border-white/10 rounded-2xl p-3.5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white block">🏠 자택 (기본 출발지)</label>
                    <select
                      value={preferences.home}
                      onChange={(e) => setPreferences(prev => ({ ...prev, home: e.target.value }))}
                      className="w-full apple-glass-light border border-white/15 rounded-xl py-2 px-3 text-xs text-white"
                    >
                      {["염창역", "여의도역", "사당역", "강남역", "구리역", "홍대입구역", "남양주시"].map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white block">🏢 회사 / 학교 (기본 목적지)</label>
                    <select
                      value={preferences.work}
                      onChange={(e) => setPreferences(prev => ({ ...prev, work: e.target.value }))}
                      className="w-full apple-glass-light border border-white/15 rounded-xl py-2 px-3 text-xs text-white"
                    >
                      {["염창역", "여의도역", "사당역", "강남역", "구리역", "홍대입구역", "남양주시"].map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      setStartStation(preferences.home);
                      setEndStation(preferences.work);
                      showToast("🏡 루틴 경로로 출발-목적지가 재구현 설정되었습니다.");
                    }}
                    className="w-full py-2 bg-[#0A84FF] text-white rounded-xl text-xs font-bold transition-transform active:scale-95"
                  >
                    기본 루틴으로 지도 동기화
                  </button>
                </div>
              </div>

              {/* Travel Constraints & Personalization (SET-05) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">세부 이동 조건</span>
                <div className="apple-glass border border-white/10 rounded-2xl overflow-hidden divide-y divide-[#25282B]">
                  <div className="p-3">
                    <label className="flex justify-between items-center text-xs text-white">
                      <span>택시 선탑승 최대 요금 상한</span>
                      <select
                        value={preferences.maxTaxiFee}
                        onChange={(e) => setPreferences(prev => ({ ...prev, maxTaxiFee: Number(e.target.value) }))}
                        className="apple-glass-light text-[#0A84FF] text-[11px] font-mono px-2 py-1 outline-none rounded border border-white/10"
                      >
                        <option value={0}>0원 (이용 안함)</option>
                        <option value={5000}>5,000원</option>
                        <option value={10000}>10,000원</option>
                        <option value={20000}>20,000원</option>
                        <option value={100000}>제한 없음</option>
                      </select>
                    </label>
                  </div>
                  <div className="p-3">
                    <label className="flex justify-between items-center text-xs text-white">
                      <span>환승 시 도보 허용 시간</span>
                      <select
                        value={preferences.walkLimitMin}
                        onChange={(e) => setPreferences(prev => ({ ...prev, walkLimitMin: Number(e.target.value) }))}
                        className="apple-glass-light text-[#0A84FF] text-[11px] font-mono px-2 py-1 outline-none rounded border border-white/10"
                      >
                        <option value={5}>5분 이하</option>
                        <option value={10}>10분 이하</option>
                        <option value={15}>15분 이하</option>
                        <option value={20}>20분 이하</option>
                      </select>
                    </label>
                  </div>
                  <div className="p-3">
                    <label className="flex justify-between items-center text-xs text-white">
                      <span>혼잡 회피 민감도</span>
                      <select
                        value={preferences.crowdSensitivity}
                        onChange={(e) => setPreferences(prev => ({ ...prev, crowdSensitivity: e.target.value as any }))}
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
                      onClick={() => setPreferences(prev => ({ ...prev, useBike: !prev.useBike }))}
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

              {/* AI Style Customizer (SET-03) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">AI 챗봇 브리핑 스타일</span>
                <div className="apple-glass border border-white/10 rounded-2xl p-2 flex gap-1">
                  {([
                    { id: "brief", label: "간결형" },
                    { id: "detailed", label: "세부설명형" },
                    { id: "emergency", label: "지각긴급형" }
                  ] as const).map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setPreferences(prev => ({ ...prev, aiStyle: style.id }));
                        showToast(`🤖 AI 응답 톤앤매너가 '${style.label}' 스타일로 변경되었습니다.`);
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

              {/* Data Origins & Schema References (SET-04) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">공공데이터 예측 출처 안내</span>
                <div className="apple-glass border border-white/10 rounded-2xl p-3.5 space-y-2 text-[10.5px] leading-relaxed text-white/70">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1.5 text-white">
                    <span className="font-bold font-sans">실시간 데이터 출처</span>
                    <span className="text-[#0A84FF] text-[10px] font-mono">2026 기준 가동</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>실시간 버스위치 및 잔여석</strong>: 경기도 버스정보 GBIS open API</li>
                    <li><strong>지하철 혼잡도 가용범위</strong>: 서울 열린데이터광장 + 서울교통공사 빅데이터 통계</li>
                    <li><strong>따릉이 자전거 실시간 카운트</strong>: 서울 열린데이터광장 따릉이 대여</li>
                    <li><strong>지상구간 경로 가중치 역산</strong>: OSM 네트워크 보행 기반 엔진</li>
                  </ul>
                  <div className="apple-glass-light p-2 rounded-lg text-[9.5px] font-mono text-white/50 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span>본 추정 결과물은 기상 및 도로 통제상 오차가 있을 수 있습니다.</span>
                  </div>
                </div>
              </div>

              {/* Platform Info footer */}
              <div className="text-center pt-2 space-y-1">
                <span className="text-[10px] text-white/50 font-mono block">탈수있나 Metropilitan FSD Platform v0.1</span>
                <span className="text-[9px] text-white/50 font-mono block">국토교통 공공 데이터 활용 경진대비 출품작</span>
              </div>

            </div>
          )}

        </main>

        {/* Global AI Chat Layer */}
        {mapLayer !== "default" && mapLayer !== "report_detail" && (
          <div className={`absolute z-40 transition-all duration-300 pointer-events-none ${
            mapLayer === "ai_result"
              ? "bottom-[76px] inset-x-3"
              : "inset-x-0 top-0 bottom-[64px] flex flex-col justify-end"
          }`}>
             
             {mapLayer === "ai_result" && (
                <div className="apple-glass border border-white/20 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 pointer-events-auto">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                      <span className="text-xs font-bold text-white">AI 전략 브리핑 종료</span>
                    </div>
                    <button onClick={() => setMapLayer("default")} className="text-white/50 hover:text-white transition-colors">
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                  <div className="apple-glass-light border border-white/10 p-3 rounded-xl">
                    <p className="text-[11px] text-white/80 leading-relaxed font-sans line-clamp-3">
                      {chatMessages[chatMessages.length - 1]?.text?.replace(/[*#]/g, '') || "분석 완료"}
                    </p>
                  </div>

                  {plans.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-white/50 font-bold px-1">추천 전술 경로 (터치하여 지도 확인)</span>
                      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {plans.map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => {
                               setSelectedPlan(plan);
                               // No need to peek actually, result card leaves map visible!
                            }}
                            className={`shrink-0 border px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                              selectedPlan?.id === plan.id
                                ? "bg-[#0A84FF]/20 border-[#0A84FF] text-white"
                                : "apple-glass border-white/10 text-white/60 hover:text-white hover:border-white/20"
                            }`}
                          >
                             {plan.name} <span className="text-[#0A84FF] ml-1">{plan.eta}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setMapLayer("report_detail");
                      }}
                      className="flex-1 apple-glass hover:bg-white/10 border border-[#0A84FF]/50 text-[#0A84FF] py-2 rounded-xl text-xs font-bold transition-colors shadow-[0_0_12px_rgba(10,132,255,0.2)]"
                    >
                      상세 경로 확인
                    </button>
                    <button 
                      onClick={() => {
                         handleSaveReport();
                         setActiveTab("archive");
                         setMapLayer("default");
                      }}
                      className="flex-1 bg-[#0A84FF] text-white py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      전술 리포트 생성
                    </button>
                  </div>
                </div>
             )}

             {(mapLayer === "ai_overlay" || mapLayer === "ai_peek") && (
                <>
                  <div 
                    className={`absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-[2px] pointer-events-auto ${
                      mapLayer === "ai_peek" ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                    onClick={() => setMapLayer("default")}
                  />
                  <div 
                    className={`relative apple-glass shadow-[0_-8px_32px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 pointer-events-auto cursor-pointer border border-white/10 ${
                      mapLayer === "ai_peek" ? "h-[70px] rounded-[24px] mx-3 mb-3 opacity-90 hover:opacity-100" : "w-full rounded-t-[32px] h-[75vh]"
                  }`}
                    onClick={() => {
                        if (mapLayer === "ai_peek") setMapLayer("ai_overlay");
                    }}
                  >
                     {/* Drag Handle */}
                     <div className="w-full flex items-center justify-between px-4 pt-3 pb-2">
                         <div className="w-6" /> {/* Spacer for centering */}
                         <div 
                            className="flex-1 flex justify-center cursor-grab active:cursor-grabbing py-2"
                            onClick={(e) => {
                               e.stopPropagation();
                               setMapLayer(mapLayer === "ai_overlay" ? "ai_peek" : "ai_overlay");
                            }}
                         >
                            <div className="w-12 h-1.5 bg-white/25 rounded-full" />
                         </div>
                         <button 
                            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMapLayer("default");
                            }}
                         >
                             <Plus className="w-6 h-6 rotate-45" />
                         </button>
                     </div>
                     <div 
                       className={`flex-1 flex flex-col overflow-hidden px-4 pb-4 ${mapLayer === "ai_peek" ? "pointer-events-none opacity-40 blur-[1px]" : "opacity-100"}`}
                     >
                         {/* Chat screen introductory guidance header */}
                         <div className="apple-glass rounded-2xl border border-white/10 p-3 text-center mb-2.5 shrink-0">
                           <span className="text-[10px] bg-[#0A84FF]/10 text-[#0A84FF] px-2.5 py-1 rounded-full font-mono font-bold inline-block mb-1.5">GEMINI 3.5 AI ENGINE</span>
                           <p className="text-[11px] text-white/70 leading-relaxed max-w-[280px] mx-auto">
                             지도의 현재 상태를 결합해 복합수단 최적 해법을 브리핑합니다. 질문 시 자동으로 지도 경로가 반응합니다.
                           </p>
                         </div>
           
                         {/* Chat Message Lists */}
                         <div className="flex-1 space-y-3 overflow-y-auto pr-1 mb-3 scrollbar-none min-h-[120px]">
                           {chatMessages.map((msg) => (
                             <div
                               key={msg.id}
                               className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                             >
                               <div
                                 className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                                   msg.sender === "user"
                                     ? "bg-[#0A84FF] text-white rounded-tr-none font-sans"
                                     : "apple-glass text-[#E3E5DD] border border-white/10 rounded-tl-none font-sans leading-relaxed"
                                 }`}
                               >
                                 {msg.sender === "ai" ? renderMarkdown(msg.text) : <p className="font-bold leading-relaxed">{msg.text}</p>}
                                 <div className="flex items-center justify-between mt-2.5">
                                   <span
                                     className={`text-[8.5px] font-mono ${
                                       msg.sender === "user" ? "text-white/60" : "text-white/50"
                                     }`}
                                   >
                                     {msg.timestamp}
                                   </span>
                                   {msg.sender === "ai" && msg.suggestedReportType && (
                                     <button
                                       onClick={() => {
                                         setSelectedReportType(msg.suggestedReportType as ReportType); setMapLayer("report_detail");
                                         setActiveTab("map");
                                       }}
                                       className="text-[#0A84FF] flex items-center gap-0.5 text-[9px] font-bold font-sans bg-[#0A84FF]/10 px-1.5 py-0.5 rounded active:scale-95 transition-transform"
                                     >
                                       <span>지도에서 보기</span>
                                       <Map className="w-2.5 h-2.5" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                             </div>
                           ))}
                           
                           {chatbotLoading && (
                             <div className="flex justify-start">
                               <div className="apple-glass border border-white/10 rounded-2xl rounded-tl-none p-3.5 max-w-[80%] space-y-2">
                                 <div className="flex gap-1">
                                   <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce" />
                                   <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce [animation-delay:0.2s]" />
                                   <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce [animation-delay:0.4s]" />
                                 </div>
                                 <span className="text-[10px] text-white/50 font-mono block">대중교통 네트워크 분석 및 최안심 경로 역산 중...</span>
                               </div>
                             </div>
                           )}
                           
                           <div ref={chatEndRef} />
                         </div>
           
                         {/* Suggested Prompts Grid Row (CHAT-01) */}
                         <div className="space-y-2 shrink-0">
                           <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider block">추천 안전 질문</span>
                           <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                             {[
                               "9시까지 갈 수 있는 경로 알려줘",
                               "대중교통 9호선 어느 칸 탑승?",
                               "막차 놓쳤을때 복구 플랜 B",
                               "이번 8100번 버스 탈 수 있어?"
                             ].map((p, idx) => (
                               <button
                                 key={idx}
                                 onClick={() => handleSendMessage(p)}
                                 className="text-left apple-glass hover:bg-white/10 border border-white/10 p-2 rounded-xl text-[10px] text-white/70 transition-colors truncate block"
                               >
                                 💡 {p}
                               </button>
                             ))}
                           </div>
           
                           {/* Input Area Bar */}
                           <div className="flex gap-2">
                             <input
                               id="chat-input-field"
                               type="text"
                               value={chatInput}
                               onChange={(e) => setChatInput(e.target.value)}
                               onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chatInput)}
                               className="flex-1 apple-glass border border-white/10 focus:border-[#0A84FF] rounded-xl py-3 px-4 text-xs text-white outline-none font-sans"
                               placeholder="지각 예방에 관해 무엇이든 물어보세요..."
                             />
                             <button
                               id="chat-send-action"
                               onClick={() => handleSendMessage(chatInput)}
                               className="bg-[#0A84FF] text-white px-4 rounded-xl text-xs font-bold transition-transform active:scale-95 shrink-0"
                             >
                               전송
                             </button>
                           </div>
                         </div>
           
           
                     </div>
                  </div>
                </>
             )}
          </div>
        )}


        {/* Global Bottom Navigation Tab Bar */}
        <nav className="absolute inset-x-0 bottom-0 h-[64px] bg-black/40 backdrop-blur-2xl border-t border-white/10 grid grid-cols-3 select-none shrink-0 z-30 p-1 pointer-events-auto rounded-b-[44px]">
          {([
            { id: "map", label: "지도", icon: Map },
            { id: "archive", label: "기록", icon: FileText },
            { id: "settings", label: "설정", icon: Sliders }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabId);
                  if (tab.id === "map") {
                    setMapLayer("default");
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? "text-[#0A84FF]" : "text-white/50 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                <span className="text-[10px] font-bold font-sans tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
