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
    <nav className="absolute inset-x-0 bottom-0 h-[64px] bg-black/40 backdrop-blur-2xl border-t border-white/10 grid grid-cols-3 select-none shrink-0 z-30 p-1 pointer-events-auto rounded-b-[44px]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
  );
}
