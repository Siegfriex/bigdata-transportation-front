import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MessageSquare,
  ChevronRight,
  Navigation,
  Sparkles,
  Bike,
  Plus,
  BookmarkCheck,
  RotateCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Calendar,
  Layers,
} from "lucide-react";
import { TabId, ReportType, RoutePlan, SavedReport, UserPreferences, ChatMessage } from "./types";
import { getDefaultPreferences, getSavedReportsMock, getRoutePlans, getCarSurvivalDetails, CarDetail } from "./data";
import { OnboardingOverlay } from "./features/complete-onboarding";
import { RoutePresetCarousel, type RoutePreset } from "./features/generate-route-plan";
import { createSavedReport, isDuplicateSavedReport } from "./features/save-report";
import { createFallbackChatMessage, sendAiChat } from "./features/send-ai-chat";
import { DEFAULT_VISIBLE_LAYERS, type MapLayerState } from "./features/toggle-map-layer";
import { STORAGE_KEYS } from "./shared/config";
import { formatKoreanTime } from "./shared/lib/time";
import { usePersistentState } from "./shared/model/usePersistentState";
import { AppShell } from "./app/layouts";
import { ToastOverlay } from "./shared/ui/toast";
import { AiChatLayer } from "./widgets/ai-chat-panel";
import { BottomNavigation } from "./widgets/bottom-navigation";
import { ReportDetailPanel, RouteConditionCard } from "./widgets/report-sheet";
import InteractiveMap from "./widgets/transit-map-panel";
import { TopAppBar } from "./widgets/top-app-bar";

const isCrowdSensitivity = (value: string): value is UserPreferences["crowdSensitivity"] =>
  value === "low" || value === "normal" || value === "high";

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
    <AppShell>
      <ToastOverlay message={toastMessage} />

      {/* Screen container: Styled like a high-density, glassmorphic premium physical phone chassis on desktop view! */}
      <div className="w-full max-w-[412px] h-screen md:h-[844px] apple-glass rounded-none md:rounded-[44px] border-none md:border-[8px] md:border-[#1E1E1E]/80 shadow-[0_32px_64px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden">
        
        {/* Mock notch / camera indicator inside device */}
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-7 bg-black rounded-b-3xl z-40 items-center justify-center shadow-lg">
          <div className="w-3 h-3 rounded-full bg-[#111111] border border-[#222] mr-3 shadow-inner" />
          <div className="w-12 h-1.5 bg-[#444] rounded-full" />
        </div>

        {showOnboarding && (
          <OnboardingOverlay
            step={onboardingStep}
            user={user}
            preferences={preferences}
            onNext={() => setOnboardingStep(2)}
            onBypass={() => {
              setUser({ name: "비회원 체험자", isLoggedIn: false });
              setShowOnboarding(false);
              showToast("비회원 체험 모드로 진입했습니다.");
            }}
            onChangeUser={setUser}
            onChangePreferences={setPreferences}
            onFinish={() => {
              setUser((prev) => ({ ...prev, isLoggedIn: true }));
              setShowOnboarding(false);
              showToast(`환영합니다, ${user.name}님! 설정이 성공 탑재되었습니다.`);
            }}
          />
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

        <TopAppBar
          userName={user.name}
          showReset={!showOnboarding}
          onReset={() => setShowOnboarding(true)}
        />

        {/* Primary Screen Body Panel */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 relative z-10 pt-[52px] pointer-events-none pb-[64px]">
          
          {/* TAB 1: 의사결정 시트 (Main Map Action Sheet) */}
          {activeTab === "map" && (
            <div className="flex-1 flex flex-col p-3 pt-4 space-y-3 pointer-events-none justify-start">
              
              <div className="flex-1 shrink-0 min-h-[40px]"></div>

              <RoutePresetCarousel
                startStation={startStation}
                endStation={endStation}
                selectedReportType={selectedReportType}
                onSelectPreset={triggerPreset}
              />

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
                <RouteConditionCard
                  startStation={startStation}
                  endStation={endStation}
                  deadlineTime={deadlineTime}
                  onChangeStartStation={setStartStation}
                  onChangeEndStation={setEndStation}
                  onChangeDeadlineTime={setDeadlineTime}
                />

              <ReportDetailPanel
                selectedReportType={selectedReportType}
                startStation={startStation}
                endStation={endStation}
                deadlineTime={deadlineTime}
                plans={plans}
                selectedPlan={selectedPlan}
                carDetails={carDetails}
                activeCarNo={activeCarNo}
                onSelectReport={(reportType, label) => {
                  setSelectedReportType(reportType);
                  showToast(`📊 '${label}' 분석 보고서가 로딩되었습니다.`);
                }}
                onSelectCar={(carNo) => {
                  setActiveCarNo(carNo);
                  showToast(`🚇 ${carNo}번 칸 상세 분석을 로드했습니다.`);
                }}
                onSelectPlan={setSelectedPlan}
                onCopySummary={showToast}
                onSaveReport={handleSaveReport}
                onAskAiBriefing={() => {
                  setActiveTab("map");
                  setMapLayer("ai_overlay");
                  handleSendMessage(`${startStation}에서 ${endStation} 가는 지각처방 리포트 요약해줘`);
                  showToast("🤖 리포트 근거 조회를 위해 AI 챗봇이 개입합니다.");
                }}
              />
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
                        onChange={(e) => {
                          if (isCrowdSensitivity(e.target.value)) {
                            setPreferences((prev) => ({ ...prev, crowdSensitivity: e.target.value }));
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

        <AiChatLayer
          mapLayer={mapLayer}
          chatMessages={chatMessages}
          chatInput={chatInput}
          chatbotLoading={chatbotLoading}
          plans={plans}
          selectedPlan={selectedPlan}
          chatEndRef={chatEndRef}
          onClose={() => setMapLayer("default")}
          onSetMapLayer={setMapLayer}
          onSelectPlan={setSelectedPlan}
          onSaveTacticalReport={() => {
            handleSaveReport();
            setActiveTab("archive");
            setMapLayer("default");
          }}
          onShowReport={(reportType) => {
            setSelectedReportType(reportType);
            setMapLayer("report_detail");
            setActiveTab("map");
          }}
          onChangeChatInput={setChatInput}
          onSendMessage={handleSendMessage}
        />


        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "map") {
              setMapLayer("default");
            }
          }}
        />

      </div>
    </AppShell>
  );
}
