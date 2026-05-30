import { OnboardingOverlay } from "./features/complete-onboarding";
import { AppShell } from "./app/layouts";
import { useAppController } from "./app/model";
import { AppRouter } from "./app/router";
import { ToastOverlay } from "./shared/ui/toast";
import { AiChatLayer } from "./widgets/ai-chat-panel";
import { BottomNavigation } from "./widgets/bottom-navigation";
import { ReportDetailPanel } from "./widgets/report-sheet";
import InteractiveMap from "./widgets/transit-map-panel";
import { TopAppBar } from "./widgets/top-app-bar";

export default function App() {
  const app = useAppController();

  return (
    <AppShell>
      <ToastOverlay message={app.toastMessage} />

      {/* Screen container: Styled like a high-density, glassmorphic premium physical phone chassis on desktop view! */}
      <div className="app-device apple-glass relative flex flex-col overflow-hidden">
        
        {/* Mock notch / camera indicator inside device */}
        <div className="z-layer-device-chrome hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-7 bg-black rounded-b-3xl items-center justify-center shadow-lg">
          <div className="w-3 h-3 rounded-full bg-[#111111] border border-[#222] mr-3 shadow-inner" />
          <div className="w-12 h-1.5 bg-[#444] rounded-full" />
        </div>

        {app.showOnboarding && <OnboardingOverlay {...app.onboardingOverlayProps} />}

        {/* MAP LAYER (Z0) - Always Active & Full Screen */}
        <div className="z-layer-map absolute inset-0 pointer-events-auto">
          <InteractiveMap {...app.transitMapProps} />
        </div>

        <TopAppBar {...app.topAppBarProps} />

        {/* Primary Screen Body Panel */}
        <main className="z-layer-content flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 relative pt-[52px] pointer-events-none pb-[64px]">
          <AppRouter {...app.routerProps} />
        </main>

        <AiChatLayer {...app.aiChatLayerProps} />
        {app.showReportSheet && (
          <ReportDetailPanel {...app.reportDetailPanelProps} />
        )}
        <BottomNavigation {...app.bottomNavigationProps} />

      </div>
    </AppShell>
  );
}
