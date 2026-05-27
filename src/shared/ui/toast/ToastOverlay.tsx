import { Sparkles } from "lucide-react";

interface ToastOverlayProps {
  message: string | null;
}

export function ToastOverlay({ message }: ToastOverlayProps) {
  if (!message) return null;

  return (
    <div id="toast-overlay" className="fixed top-5 left-1/2 -translate-x-1/2 apple-glass text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-[0_12px_24px_rgba(0,0,0,0.5)] z-[100] flex items-center gap-1.5 animate-in fade-in slide-in-from-top-6 duration-200">
      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#0A84FF]" />
      <span>{message}</span>
    </div>
  );
}
