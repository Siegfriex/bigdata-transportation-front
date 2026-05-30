import { CheckCircle2 } from "lucide-react";

interface ToastOverlayProps {
  message: string | null;
}

export function ToastOverlay({ message }: ToastOverlayProps) {
  if (!message) return null;

  return (
    <div id="toast-overlay" data-testid="save-report-toast" role="status" aria-live="polite" className="surface-card z-layer-toast fixed top-5 left-1/2 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white animate-in fade-in slide-in-from-top-6 duration-200">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#0A84FF]" />
      <span>{message}</span>
    </div>
  );
}
