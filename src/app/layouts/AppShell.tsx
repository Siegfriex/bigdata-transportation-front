import type { ReactNode } from "react";
import { cn } from "../../shared/lib/cn";

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-black apple-mesh-bg text-[#FFFFFF] font-sans antialiased flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-x-hidden", className)}>
      {children}
    </div>
  );
}
