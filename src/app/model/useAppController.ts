import { useCallback, useMemo, useReducer, useState, type ComponentProps } from "react";
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
import { initialMapDecisionState, mapDecisionReducer } from "./mapDecisionReducer";

export function useAppController() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [user, setUser] = useState<{ name: string; isLoggedIn: boolean }>({
    name: "김도윤",
    isLoggedIn: false,
  });
  const [decisionState, dispatchDecision] = useReducer(mapDecisionReducer, initialMapDecisionState);
  const [preferences, setPreferences] = useUserPreferencesStore();
  const [savedReports, setSavedReports] = useSavedReportsStore();
  const routePlanner = useRoutePlanner(preferences);
  const [visibleLayers, setVisibleLayers] = useState(DEFAULT_VISIBLE_LAYERS);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(26);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { activeTab, mapLayer, restoredReport } = decisionState;

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
    dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
  }, [routePlanner]);

  const triggerPreset = useCallback((preset: RoutePreset) => {
    const nextPlans = routePlanner.getPlansForStations(preset.start, preset.end);
    routePlanner.applyPreset(preset);
    routePlanner.setSelectedPlan(nextPlans[0] ?? null);
    dispatchDecision({ type: "ROUTE_PRESET_OPENED" });
    showToast(`'${preset.title}' 전략리포트를 열었습니다.`);
  }, [routePlanner, showToast]);

  const applyAiResponse = useCallback((data: AiChatResponse) => {
    if (data.recommendedCarNo) {
      routePlanner.setActiveCarNo(data.recommendedCarNo);
    }

  }, [routePlanner]);

  const applyFallbackResponse = useCallback((fallbackMsg: ChatMessage) => {
    if (fallbackMsg.suggestedReportType === "carriage") {
      routePlanner.setActiveCarNo("3-3");
    }
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
      showToast("이미 저장된 전략리포트입니다.");
      return;
    }

    const newReport = createSavedReport({
      selectedPlan: routePlanner.selectedPlan,
      selectedReportType: routePlanner.selectedReportType,
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
    });

    setSavedReports((prev) => [newReport, ...prev]);
    showToast("전략리포트를 저장했습니다.");
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
        onSetMapLayer: (layer) => {
          dispatchDecision({ type: "MAP_LAYER_SET", layer });
        },
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
          const restoredPlan =
            report.selectedPlanSnapshot ??
            restoredPlans.find((plan) => plan.id === report.selectedPlanId) ??
            restoredPlans[0] ??
            null;
          routePlanner.setStartStation(report.from);
          routePlanner.setEndStation(report.to);
          routePlanner.setSelectedReportType(report.type);
          routePlanner.setSelectedPlan(restoredPlan);
          if (getReportDaySafe(report.date)) setSelectedCalendarDay(getReportDaySafe(report.date)!);
          dispatchDecision({ type: "SAVED_REPORT_RESTORED", report });
          showToast("저장된 여정과 전략리포트를 복원했습니다.");
        },
      },
      settingsPageProps: {
        preferences,
        onChangePreferences: setPreferences,
        onSyncRoutine: () => {
          routePlanner.setStartStation(preferences.home);
          routePlanner.setEndStation(preferences.work);
          dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
          showToast("루틴 경로로 출발-목적지를 설정했습니다.");
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
      isRestoredSnapshot: Boolean(restoredReport),
      savedReportId: restoredReport?.id,
      snapshotLabel: restoredReport?.snapshotLabel ?? (restoredReport ? "저장 시점 기준" : undefined),
      onClose: () => dispatchDecision({ type: "REPORT_CLOSED" }),
      onChangeStartStation: (station: string) => {
        routePlanner.setStartStation(station);
        dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
      },
      onChangeEndStation: (station: string) => {
        routePlanner.setEndStation(station);
        dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
      },
      onChangeDeadlineTime: (time: string) => {
        routePlanner.setDeadlineTime(time);
        dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
      },
      onSelectReport: (reportType: ReportType, label: string) => {
        routePlanner.setSelectedReportType(reportType);
        showToast(`'${label}' 근거 보기로 전환했습니다.`);
      },
      onSelectCar: (carNo: string) => {
        routePlanner.setActiveCarNo(carNo);
        showToast(`${carNo}번 칸 근거를 갱신했습니다.`);
      },
      onSelectPlan: (plan: typeof routePlanner.plans[number]) => {
        routePlanner.setSelectedPlan(plan);
        dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
        showToast(`경로가 '${plan.name.replace(/^추천:\\s?/, "")}' 기준으로 갱신되었습니다.`);
      },
      onSaveReport: () => {
        handleSaveReport();
      },
      onAskAiBriefing: () => {
        const activePlan = routePlanner.selectedPlan;
        const snapshotText = restoredReport ? "저장 리포트 기준" : "현재 선택 전략 기준";
        const seedText = [
          `**${snapshotText}**`,
          `${routePlanner.startStation}에서 ${routePlanner.endStation}까지의 선택 전략을 설명합니다.`,
          activePlan ? `선택 경로: ${activePlan.name.replace(/^추천:\s?/, "")}` : "선택 경로: 현재 1순위 경로",
          `리포트 유형: ${getReportTypeLabel(routePlanner.selectedReportType)}`,
          "도착 여유, 탑승 가능성, 생존칸, 복구전략 근거를 같은 맥락에서 봅니다.",
        ].join("\n\n");
        dispatchDecision({ type: "AI_EVIDENCE_OPENED", returnLayer: "report_detail" });
        aiChat.startContextualBriefing(
          seedText,
          `${routePlanner.startStation}에서 ${routePlanner.endStation}까지 선택된 ${activePlan ? activePlan.name.replace(/^추천:\s?/, "") : "현재"} 전략의 근거를 설명해줘`
        );
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
      startStation: routePlanner.startStation,
      endStation: routePlanner.endStation,
      reportType: routePlanner.selectedReportType,
      isRestoredSnapshot: Boolean(restoredReport),
      savedReportId: restoredReport?.id,
      snapshotLabel: restoredReport?.snapshotLabel,
      chatEndRef: aiChat.chatEndRef,
      onClose: () => dispatchDecision({ type: "AI_EVIDENCE_CLOSED" }),
      onSetMapLayer: (layer) => dispatchDecision({ type: "MAP_LAYER_SET", layer }),
      onSelectPlan: (plan) => {
        routePlanner.setSelectedPlan(plan);
        dispatchDecision({ type: "LIVE_CONTEXT_SELECTED" });
        showToast(`경로가 '${plan.name.replace(/^추천:\s?/, "")}' 기준으로 갱신되었습니다.`);
      },
      onSaveTacticalReport: () => {
        handleSaveReport();
      },
      onShowReport: (reportType: ReportType) => {
        routePlanner.setSelectedReportType(reportType);
        dispatchDecision({ type: "REPORT_TYPE_SHOWN" });
      },
      onChangeChatInput: aiChat.setChatInput,
      onSendMessage: aiChat.sendMessage,
      onRetryMessage: aiChat.retryLastMessage,
    } satisfies ComponentProps<typeof AiChatLayer>,
    bottomNavigationProps: {
      activeTab,
      onTabChange: (tab: TabId) => {
        dispatchDecision({ type: "TAB_CHANGED", tab });
      },
    } satisfies ComponentProps<typeof BottomNavigation>,
  };
}

function getReportDaySafe(date: string) {
  const match = date.match(/-(\d{2})$/);
  return match ? parseInt(match[1], 10) : null;
}

function getReportTypeLabel(reportType: ReportType) {
  if (reportType === "deadline") return "마감도착 리포트";
  if (reportType === "boarding") return "탑승가능성 리포트";
  if (reportType === "carriage") return "생존칸 리포트";
  return "복구전략 리포트";
}
