import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="text-[#0A84FF] font-sans font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="bg-white/20 px-1 py-0.5 rounded text-[11px] font-mono text-white">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderLines(text: string, keyPrefix: string): ReactNode[] {
  const lines = text.split("\n");
  return lines.flatMap((line, index) => {
    const nodes = renderInline(line, `${keyPrefix}-line-${index}`);
    if (index === lines.length - 1) return nodes;
    return [...nodes, <br key={`${keyPrefix}-br-${index}`} />];
  });
}

export function renderSafeMarkdown(text: string): ReactNode {
  return text.split("\n\n").map((paragraph, index) => {
    const trimmed = paragraph.trim();

    if (trimmed.startsWith("- ")) {
      return (
        <ul key={index} className="list-disc pl-5 my-2 space-y-1.5 font-sans text-xs text-[#E3E5DD]">
          {paragraph.split("\n").map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item.replace(/^- /, ""), `${index}-ul-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    }

    if (/^\d+\./.test(trimmed)) {
      return (
        <ol key={index} className="list-decimal pl-5 my-2 space-y-1.5 font-sans text-xs text-[#E3E5DD]">
          {paragraph.split("\n").map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item.replace(/^\d+\.\s*/, ""), `${index}-ol-${itemIndex}`)}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={index} className="text-xs leading-relaxed text-white/90 mb-2 font-sans">
        {renderLines(paragraph, `${index}-p`)}
      </p>
    );
  });
}
