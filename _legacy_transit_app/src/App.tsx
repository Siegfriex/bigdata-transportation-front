import { OnboardingOverlay } from "./features/complete-onboarding";
import { AppShell } from "./app/layouts";
import { useAppController } from "./app/model";
import { AppRouter } from "./app/router";
import { ToastOverlay } from "./shared/ui/toast";
import { AiChatLayer } from "./widgets/ai-chat-panel";
import { BottomNavigation } from "./widgets/bottom-navigation";
import InteractiveMap from "./widgets/transit-map-panel";
import { TopAppBar } from "./widgets/top-app-bar";

export default function App() {
  const app = useAppController();

  return (
    <AppShell>
      <ToastOverlay message={app.toastMessage} />

      {/* Screen container: Styled like a high-density, glassmorphic premium physical phone chassis on desktop view! */}
      <div className="w-full max-w-[412px] h-screen md:h-[844px] apple-glass rounded-none md:rounded-[44px] border-none md:border-[8px] md:border-[#1E1E1E]/80 shadow-[0_32px_64px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden">
        
        {/* Mock notch / camera indicator inside device */}
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-7 bg-black rounded-b-3xl z-40 items-center justify-center shadow-lg">
          <div className="w-3 h-3 rounded-full bg-[#111111] border border-[#222] mr-3 shadow-inner" />
          <div className="w-12 h-1.5 bg-[#444] rounded-full" />
        </div>

        {app.showOnboarding && <OnboardingOverlay {...app.onboardingOverlayProps} />}

        {/* MAP LAYER (Z0) - Always Active & Full Screen */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <InteractiveMap {...app.transitMapProps} />
        </div>

        <TopAppBar {...app.topAppBarProps} />

        {/* Primary Screen Body Panel */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 relative z-10 pt-[52px] pointer-events-none pb-[64px]">
          <AppRouter {...app.routerProps} />
        </main>

        <AiChatLayer {...app.aiChatLayerProps} />
        <BottomNavigation {...app.bottomNavigationProps} />

      </div>
    </AppShell>
  );
}
