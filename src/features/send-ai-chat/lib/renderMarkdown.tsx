import type { ReactNode } from "react";
import { renderSafeMarkdown } from "../../../shared/lib/markdown";

export function renderMarkdown(text: string): ReactNode {
  return renderSafeMarkdown(text);
}
