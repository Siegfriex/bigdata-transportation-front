import { User } from "lucide-react";

interface TopAppBarProps {
  userName: string;
  showReset: boolean;
  onReset: () => void;
}

export function TopAppBar({ userName, showReset, onReset }: TopAppBarProps) {
  return (
    <header className="absolute top-0 inset-x-0 z-20 flex shrink-0 select-none items-center justify-between border-b border-white/10 bg-black/32 px-4 py-3 backdrop-blur-2xl pointer-events-auto">
      <div className="flex items-center gap-2">
        <span className="type-brand flex items-center gap-1 text-[#0A84FF]">
          <span>탈수있나</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="type-label flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-white/62">
          <User className="w-3 h-3 text-[#0A84FF]" />
          <span className="max-w-[50px] truncate">{userName}</span>
        </div>

        {showReset && (
          <button
            onClick={onReset}
            className="type-label control-base focus-ring rounded border border-transparent px-1.5 py-0.5 text-white/45 hover:border-white/10 hover:text-white/75"
          >
            RESET
          </button>
        )}
      </div>
    </header>
  );
}
