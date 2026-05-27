import React from "react";

export function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n\n").map((para, i) => {
    let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0A84FF] font-sans font-bold">$1</strong>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-white/20 px-1 py-0.5 rounded text-[11px] font-mono text-white">$1</code>');

    if (formatted.trim().startsWith("- ")) {
      const items = formatted.split("\n");
      return (
        <ul key={i} className="list-disc pl-5 my-2 space-y-1.5 font-sans text-xs text-[#E3E5DD]">
          {items.map((item, idx) => {
            const clean = item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0A84FF] font-bold">$1</strong>');
            return <li key={idx} dangerouslySetInnerHTML={{ __html: clean }} />;
          })}
        </ul>
      );
    }

    if (/^\d+\./.test(formatted.trim())) {
      const items = formatted.split("\n");
      return (
        <ol key={i} className="list-decimal pl-5 my-2 space-y-1.5 font-sans text-xs text-[#E3E5DD]">
          {items.map((item, idx) => {
            const clean = item.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0A84FF] font-bold">$1</strong>');
            return <li key={idx} dangerouslySetInnerHTML={{ __html: clean }} />;
          })}
        </ol>
      );
    }

    return (
      <p
        key={i}
        className="text-xs leading-relaxed text-white/90 mb-2 font-sans"
        dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, "<br/>") }}
      />
    );
  });
}
