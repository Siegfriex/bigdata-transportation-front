import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-white/12 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#D7ECFF]">
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

    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={index} className="mb-1.5 mt-3 text-[12px] font-extrabold leading-snug text-white first:mt-0">
          {renderInline(trimmed.replace(/^###\s*/, ""), `${index}-h4`)}
        </h4>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={index} className="mb-2 mt-3 text-[13px] font-extrabold leading-snug text-white first:mt-0">
          {renderInline(trimmed.replace(/^##\s*/, ""), `${index}-h3`)}
        </h3>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={index} className="my-2 border-l-2 border-[#0A84FF]/70 pl-3 text-[12px] font-medium leading-relaxed text-white/75">
          {renderLines(paragraph.replace(/^>\s?/gm, ""), `${index}-quote`)}
        </blockquote>
      );
    }

    if (trimmed.startsWith("- ")) {
      return (
        <ul key={index} className="my-2 list-disc space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-white/82 marker:text-[#0A84FF]">
          {paragraph.split("\n").map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item.replace(/^- /, ""), `${index}-ul-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    }

    if (/^\d+\./.test(trimmed)) {
      return (
        <ol key={index} className="my-2 list-decimal space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-white/82 marker:font-mono marker:text-[#0A84FF]">
          {paragraph.split("\n").map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item.replace(/^\d+\.\s*/, ""), `${index}-ol-${itemIndex}`)}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={index} className="mb-2 text-[12.5px] font-medium leading-relaxed text-white/84 last:mb-0">
        {renderLines(paragraph, `${index}-p`)}
      </p>
    );
  });
}
