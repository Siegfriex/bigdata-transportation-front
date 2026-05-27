import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MessageSquare, Navigation, RotateCw, ExternalLink, Layers } from "lucide-react";
import { TabId, ReportType, RoutePlan, SavedReport, UserPreferences, ChatMessage } from "./types";
import { getDefaultPreferences, getSavedReportsMock, getRoutePlans, getCarSurvivalDetails, CarDetail } from "./data";
import { OnboardingOverlay } from "./features/complete-onboarding";
import type { RoutePreset } from "./features/generate-route-plan";
import { createSavedReport, isDuplicateSavedReport } from "./features/save-report";
import { createFallbackChatMessage, initialChatMessages, sendAiChat, suggestedChatPrompts } from "./features/send-ai-chat";
import { DEFAULT_VISIBLE_LAYERS, type MapLayerState } from "./features/toggle-map-layer";
import { STORAGE_KEYS } from "./shared/config";
import { formatKoreanTime } from "./shared/lib/time";
import { usePersistentState } from "./shared/model/usePersistentState";
import { AppShell } from "./app/layouts";
import { ToastOverlay } from "./shared/ui/toast";
import { ArchiveCalendar } from "./widgets/archive-calendar";
import { AiChatLayer } from "./widgets/ai-chat-panel";
import { BottomNavigation } from "./widgets/bottom-navigation";
import { MapWorkspace } from "./widgets/map-workspace";
import { SettingsForm } from "./widgets/settings-form";
import InteractiveMap from "./widgets/transit-map-panel";
import { TopAppBar } from "./widgets/top-app-bar";

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);

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
            <MapWorkspace
              mapLayer={mapLayer}
              startStation={startStation}
              endStation={endStation}
              deadlineTime={deadlineTime}
              selectedReportType={selectedReportType}
              plans={plans}
              selectedPlan={selectedPlan}
              carDetails={carDetails}
              activeCarNo={activeCarNo}
              onSetMapLayer={setMapLayer}
              onSelectPreset={triggerPreset}
              onChangeStartStation={setStartStation}
              onChangeEndStation={setEndStation}
              onChangeDeadlineTime={setDeadlineTime}
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
          )}

          {/* TAB 3: 통근 기록 보관함 & 아카이브 (Report Archive TAB REP-01) */}
          {activeTab === "archive" && (
            <ArchiveCalendar
              savedReports={savedReports}
              selectedCalendarDay={selectedCalendarDay}
              onSelectCalendarDay={setSelectedCalendarDay}
              onClearReports={() => {
                setSavedReports([]);
                showToast("보관함이 완전히 비워졌습니다.");
              }}
              onRestoreReport={(report) => {
                setStartStation(report.from);
                setEndStation(report.to);
                setSelectedReportType(report.type);
                setActiveTab("map");
                showToast("🗺️ 해당 저장 조건으로 메인 지도를 갱신했습니다.");
              }}
            />
          )}

          {/* TAB 4: 환경설정 & 개인 맞춤 (Settings TAB SET-01) */}
          {activeTab === "settings" && (
            <SettingsForm
              preferences={preferences}
              onChangePreferences={setPreferences}
              onSyncRoutine={() => {
                setStartStation(preferences.home);
                setEndStation(preferences.work);
                showToast("🏡 루틴 경로로 출발-목적지가 재구현 설정되었습니다.");
              }}
              onShowToast={showToast}
            />
          )}

        </main>

        <AiChatLayer
          mapLayer={mapLayer}
          chatMessages={chatMessages}
          chatInput={chatInput}
          chatbotLoading={chatbotLoading}
          suggestedPrompts={suggestedChatPrompts}
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
