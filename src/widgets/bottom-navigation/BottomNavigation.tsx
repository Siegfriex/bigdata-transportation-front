import { FileText, Map, Sliders } from "lucide-react";
import type { TabId } from "../../shared/config";

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Map }> = [
  { id: "map", label: "지도", icon: Map },
  { id: "archive", label: "기록", icon: FileText },
  { id: "settings", label: "설정", icon: Sliders },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav data-testid="bottom-navigation" className="absolute inset-x-0 bottom-0 z-30 grid h-[64px] shrink-0 select-none grid-cols-3 border-t border-white/10 bg-black/45 p-1 backdrop-blur-2xl pointer-events-auto md:rounded-b-[36px]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`control-base focus-ring flex flex-col items-center justify-center gap-1 ${
              isActive ? "text-[#0A84FF]" : "text-white/50 hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
            <span className="type-caption">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
