import { useCallback, useMemo, useState, type ComponentProps } from "react";
import type { AiChatResponse, ChatMessage } from "../../entities/chat-message";
import { useSavedReportsStore, type SavedReport, type ReportType } from "../../entities/report";
import { useUserPreferencesStore } from "../../entities/user-preferences";
import { OnboardingOverlay } from "../../features/complete-onboarding";
import { useRoutePlanner, type RoutePreset } from "../../features/generate-route-plan";
import { createSavedReport, isDuplicateSavedReport } from "../../features/save-report";
import { suggestedChatPrompts, useAiChatController } from "../../features/send-ai-chat";
import { DEFAULT_VISIBLE_LAYERS, type MapLayerState } from "../../features/toggle-map-layer";
import type { TabId } from "../../shared/config";
import { AiChatLayer } from "../../widgets/ai-chat-panel";
import { BottomNavigation } from "../../widgets/bottom-navigation";
import { ReportDetailPanel } from "../../widgets/report-sheet";
import InteractiveMap from "../../widgets/transit-map-panel";
import { TopAppBar } from "../../widgets/top-app-bar";

export function useAppController() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [user, setUser] = useState<{ name: string; isLoggedIn: boolean }>({
    name: "김도윤",
    isLoggedIn: false,
  });
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [mapLayer, setMapLayer] = useState<MapLayerState>("default");
  const [preferences, setPreferences] = useUserPreferencesStore();
  const [savedReports, setSavedReports] = useSavedReportsStore();
  const routePlanner = useRoutePlanner(preferences);
  const [visibleLayers, setVisibleLayers] = useState(DEFAULT_VISIBLE_LAYERS);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(26);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const handleToggleLayer = useCallback((layer: "subway" | "bus" | "bike" | "crowd") => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleSelectStation = useCallback((type: "start" | "end", name: string) => {
    if (type === "start") routePlanner.setStartStation(name);
    else routePlanner.setEndStation(name);
  }, [routePlanner]);

  const triggerPreset = useCallback((preset: RoutePreset) => {
    const nextPlans = routePlanner.getPlansForStations(preset.start, preset.end);
    routePlanner.applyPreset(preset);
    routePlanner.setSelectedPlan(nextPlans[0] ?? null);
    setActiveTab("map");
    showToast(`📍 '${preset.title}' 전략 근거를 열었습니다.`);
    setMapLayer("report_detail");
  }, [routePlanner, showToast]);

  const applyAiResponse = useCallback((data: AiChatResponse) => {
    const nextStart = data.startStation || routePlanner.startStation;
    const nextEnd = data.endStation || routePlanner.endStation;

    routePlanner.applyStations(data.startStation, data.endStation);
    if (data.suggestedReportType) {
      routePlanner.setSelectedReportType(data.suggestedReportType);
    }
    if (data.recommendedCarNo) {
      routePlanner.setActiveCarNo(data.recommendedCarNo);
    }

    const nextPlans = routePlanner.getPlansForStations(nextStart, nextEnd);
    if (data.routeIndex !== undefined && nextPlans[data.routeIndex]) {
      routePlanner.setSelectedPlan(nextPlans[data.routeIndex]);
    }

    showToast("💡 AI가 지도를 분석하여 전술 경로를 업데이트했습니다.");
    setMapLayer("ai_result");
  }, [routePlanner, showToast]);

  const applyFallbackResponse = useCallback((fallbackMsg: ChatMessage) => {
    if (fallbackMsg.suggestedReportType) {
      routePlanner.setSelectedReportType(fallbackMsg.suggestedReportType);
    }
    if (fallbackMsg.suggestedReportType === "carriage") {
      routePlanner.setActiveCarNo("3-3");
    }
    setMapLayer("ai_result");
  }, [routePlanner]);

  const aiChatContext = useMemo(
    () => ({
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
      deadlineTime: routePlanner.deadlineTime,
      preferences,
    }),
    [routePlanner.deadlineTime, routePlanner.endStation, routePlanner.startStation, preferences]
  );

  const aiChat = useAiChatController({
    context: aiChatContext,
    onApplyResponse: applyAiResponse,
    onApplyFallback: applyFallbackResponse,
  });

  const handleSaveReport = useCallback(() => {
    if (!routePlanner.selectedPlan) return;
    const isExist = isDuplicateSavedReport(savedReports, {
      from: routePlanner.startStation,
      to: routePlanner.endStation,
      type: routePlanner.selectedReportType,
      selectedPlanId: routePlanner.selectedPlan.id,
    });
    if (isExist) {
      showToast("이미 보관함에 물리 장착된 리포트입니다.");
      return;
    }

    const newReport = createSavedReport({
      selectedPlan: routePlanner.selectedPlan,
      selectedReportType: routePlanner.selectedReportType,
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
    });

    setSavedReports((prev) => [newReport, ...prev]);
    showToast("💾 통근 리포트가 보관함에 영구 저장되었습니다.");
  }, [routePlanner, savedReports, setSavedReports, showToast]);

  return {
    toastMessage,
    showOnboarding,
    onboardingOverlayProps: {
      step: onboardingStep,
      user,
      preferences,
      onNext: () => setOnboardingStep(2),
      onBypass: () => {
        setUser({ name: "비회원 체험자", isLoggedIn: false });
        setShowOnboarding(false);
        showToast("비회원 체험 모드로 진입했습니다.");
      },
      onChangeUser: setUser,
      onChangePreferences: setPreferences,
      onFinish: () => {
        setUser((prev) => ({ ...prev, isLoggedIn: true }));
        setShowOnboarding(false);
        showToast(`환영합니다, ${user.name}님! 설정이 성공 탑재되었습니다.`);
      },
    } satisfies ComponentProps<typeof OnboardingOverlay>,
    transitMapProps: {
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
      onSelectStation: handleSelectStation,
      selectedPlan: routePlanner.selectedPlan,
      visibleLayers,
      onToggleLayer: handleToggleLayer,
    } satisfies ComponentProps<typeof InteractiveMap>,
    topAppBarProps: {
      userName: user.name,
      showReset: !showOnboarding,
      onReset: () => setShowOnboarding(true),
    } satisfies ComponentProps<typeof TopAppBar>,
    routerProps: {
      activeTab,
      mapPageProps: {
        mapLayer,
        startStation: routePlanner.startStation,
        endStation: routePlanner.endStation,
        selectedReportType: routePlanner.selectedReportType,
        onSetMapLayer: setMapLayer,
        onSelectPreset: triggerPreset,
      },
      archivePageProps: {
        savedReports,
        selectedCalendarDay,
        onSelectCalendarDay: setSelectedCalendarDay,
        onClearReports: () => {
          setSavedReports([]);
          showToast("보관함이 완전히 비워졌습니다.");
        },
        onRestoreReport: (report: SavedReport) => {
          const restoredPlans = routePlanner.getPlansForStations(report.from, report.to);
          routePlanner.setStartStation(report.from);
          routePlanner.setEndStation(report.to);
          routePlanner.setSelectedReportType(report.type);
          routePlanner.setSelectedPlan(
            restoredPlans.find((plan) => plan.id === report.selectedPlanId) ?? restoredPlans[0] ?? null
          );
          setActiveTab("map");
          setMapLayer("report_detail");
          showToast("🗺️ 해당 저장 조건으로 메인 지도를 갱신했습니다.");
        },
      },
      settingsPageProps: {
        preferences,
        onChangePreferences: setPreferences,
        onSyncRoutine: () => {
          routePlanner.setStartStation(preferences.home);
          routePlanner.setEndStation(preferences.work);
          showToast("🏡 루틴 경로로 출발-목적지가 재구현 설정되었습니다.");
        },
        onShowToast: showToast,
      },
    },
    showReportSheet: activeTab === "map" && mapLayer === "report_detail",
    reportDetailPanelProps: {
      selectedReportType: routePlanner.selectedReportType,
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
      deadlineTime: routePlanner.deadlineTime,
      plans: routePlanner.plans,
      selectedPlan: routePlanner.selectedPlan,
      carDetails: routePlanner.carDetails,
      activeCarNo: routePlanner.activeCarNo,
      onClose: () => setMapLayer("default"),
      onChangeStartStation: routePlanner.setStartStation,
      onChangeEndStation: routePlanner.setEndStation,
      onChangeDeadlineTime: routePlanner.setDeadlineTime,
      onSelectReport: (reportType: ReportType, label: string) => {
        routePlanner.setSelectedReportType(reportType);
        showToast(`📊 '${label}' 근거 보기로 전환했습니다.`);
      },
      onSelectCar: (carNo: string) => {
        routePlanner.setActiveCarNo(carNo);
        showToast(`🚇 ${carNo}번 칸 근거를 갱신했습니다.`);
      },
      onSelectPlan: (plan: typeof routePlanner.plans[number]) => {
        routePlanner.setSelectedPlan(plan);
        showToast(`경로가 '${plan.name.replace(/^추천:\\s?/, "")}' 기준으로 갱신되었습니다.`);
      },
      onSaveReport: () => {
        handleSaveReport();
        setMapLayer("report_detail");
      },
      onAskAiBriefing: () => {
        setMapLayer("ai_overlay");
        aiChat.sendMessage(`${routePlanner.startStation}에서 ${routePlanner.endStation} 가는 선택 전략의 근거를 요약해줘`);
        showToast("🤖 선택 전략의 근거를 AI에게 질문합니다.");
      },
    } satisfies ComponentProps<typeof ReportDetailPanel>,
    aiChatLayerProps: {
      mapLayer,
      chatMessages: aiChat.chatMessages,
      chatInput: aiChat.chatInput,
      chatError: aiChat.chatError,
      chatbotLoading: aiChat.chatbotLoading,
      suggestedPrompts: suggestedChatPrompts,
      plans: routePlanner.plans,
      selectedPlan: routePlanner.selectedPlan,
      chatEndRef: aiChat.chatEndRef,
      onClose: () => setMapLayer("default"),
      onSetMapLayer: setMapLayer,
      onSelectPlan: routePlanner.setSelectedPlan,
      onSaveTacticalReport: () => {
        handleSaveReport();
        setMapLayer("report_detail");
      },
      onShowReport: (reportType: ReportType) => {
        routePlanner.setSelectedReportType(reportType);
        setMapLayer("report_detail");
        setActiveTab("map");
      },
      onChangeChatInput: aiChat.setChatInput,
      onSendMessage: aiChat.sendMessage,
    } satisfies ComponentProps<typeof AiChatLayer>,
    bottomNavigationProps: {
      activeTab,
      onTabChange: (tab: TabId) => {
        setActiveTab(tab);
        if (tab === "map") {
          setMapLayer("default");
        }
      },
    } satisfies ComponentProps<typeof BottomNavigation>,
  };
}
