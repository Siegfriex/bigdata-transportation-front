import { User } from "lucide-react";

interface TopAppBarProps {
  userName: string;
  showReset: boolean;
  onReset: () => void;
}

export function TopAppBar({ userName, showReset, onReset }: TopAppBarProps) {
  return (
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
          <span className="truncate max-w-[50px] font-mono">{userName}</span>
        </div>

        {showReset && (
          <button
            onClick={onReset}
            className="text-[9px] font-mono text-white/50 border border-transparent hover:border-white/10 px-1.5 py-0.5 rounded transition-all"
          >
            RESET
          </button>
        )}
      </div>
    </header>
  );
}
