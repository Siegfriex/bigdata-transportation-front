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
import InteractiveMap from "../../widgets/transit-map-panel";
import { TopAppBar } from "../../widgets/top-app-bar";
import { useOnboardingState } from "./useOnboardingState";

export function useAppController() {
  const { showOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, resetOnboarding } = useOnboardingState();
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
    routePlanner.applyPreset(preset);
    showToast(`'${preset.title}' 경로 조건을 적용했습니다.`);
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

    showToast("AI 분석 결과를 지도와 리포트에 반영했습니다.");
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
    if (!routePlanner.selectedPlan) {
      showToast("저장할 경로가 없습니다. 먼저 경로를 선택해 주세요.");
      return false;
    }
    const isExist = isDuplicateSavedReport(savedReports, {
      from: routePlanner.startStation,
      to: routePlanner.endStation,
      type: routePlanner.selectedReportType,
    });
    if (isExist) {
      showToast("이미 저장된 리포트입니다.");
      return false;
    }

    const newReport = createSavedReport({
      selectedPlan: routePlanner.selectedPlan,
      selectedReportType: routePlanner.selectedReportType,
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
    });

    setSavedReports((prev) => [newReport, ...prev]);
    showToast("통근 리포트를 저장했습니다.");
    return true;
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
        completeOnboarding();
        showToast("비회원 체험 모드로 진입했습니다.");
      },
      onChangeUser: setUser,
      onChangePreferences: setPreferences,
      onFinish: () => {
        setUser((prev) => ({ ...prev, isLoggedIn: true }));
        completeOnboarding();
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
      onReset: resetOnboarding,
    } satisfies ComponentProps<typeof TopAppBar>,
    routerProps: {
      activeTab,
      mapPageProps: {
        mapLayer,
        startStation: routePlanner.startStation,
        endStation: routePlanner.endStation,
        deadlineTime: routePlanner.deadlineTime,
        selectedReportType: routePlanner.selectedReportType,
        plans: routePlanner.plans,
        selectedPlan: routePlanner.selectedPlan,
        carDetails: routePlanner.carDetails,
        activeCarNo: routePlanner.activeCarNo,
        onSetMapLayer: setMapLayer,
        onSelectPreset: triggerPreset,
        onChangeStartStation: routePlanner.setStartStation,
        onChangeEndStation: routePlanner.setEndStation,
        onChangeDeadlineTime: routePlanner.setDeadlineTime,
        onSelectReport: (reportType: ReportType, label: string) => {
          routePlanner.setSelectedReportType(reportType);
          showToast(`'${label}' 리포트를 열었습니다.`);
        },
        onSelectCar: (carNo: string) => {
          routePlanner.setActiveCarNo(carNo);
          showToast(`${carNo}번 칸 정보를 선택했습니다.`);
        },
        onSelectPlan: routePlanner.setSelectedPlan,
        onCopySummary: showToast,
        onSaveReport: handleSaveReport,
        onAskAiBriefing: () => {
          setActiveTab("map");
          setMapLayer("ai_overlay");
          aiChat.sendMessage(`${routePlanner.startStation}에서 ${routePlanner.endStation} 가는 지각처방 리포트 요약해줘`);
          showToast("AI 리포트 요약을 요청했습니다.");
        },
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
          routePlanner.setStartStation(report.from);
          routePlanner.setEndStation(report.to);
          routePlanner.setSelectedReportType(report.type);
          setActiveTab("map");
          showToast("저장된 조건을 지도에 반영했습니다.");
        },
      },
      settingsPageProps: {
        preferences,
        onChangePreferences: setPreferences,
        onSyncRoutine: () => {
          routePlanner.setStartStation(preferences.home);
          routePlanner.setEndStation(preferences.work);
          showToast("기본 루틴을 지도에 반영했습니다.");
        },
        onShowToast: showToast,
      },
    },
    aiChatLayerProps: {
      mapLayer,
      chatMessages: aiChat.chatMessages,
      chatInput: aiChat.chatInput,
      chatbotLoading: aiChat.chatbotLoading,
      suggestedPrompts: suggestedChatPrompts,
      plans: routePlanner.plans,
      selectedPlan: routePlanner.selectedPlan,
      chatEndRef: aiChat.chatEndRef,
      onClose: () => setMapLayer("default"),
      onSetMapLayer: setMapLayer,
      onSelectPlan: routePlanner.setSelectedPlan,
      onSaveTacticalReport: () => {
        if (handleSaveReport()) {
          setActiveTab("archive");
          setMapLayer("default");
        }
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
