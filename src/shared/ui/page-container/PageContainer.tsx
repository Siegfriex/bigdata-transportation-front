import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0", className)}>
      {children}
    </main>
  );
}
