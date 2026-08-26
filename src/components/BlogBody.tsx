import { ReactNode } from "react";

function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]*\]\([^)]*\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${key}-${i}`} className="font-[950] text-[var(--text)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={`${key}-${i}`}
          className="px-1.5 py-0.5 rounded-[6px] bg-[var(--soft)] border border-[var(--line-4)] text-[0.92em] text-[var(--primary)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
    if (linkMatch) {
      const [, href, url] = linkMatch;
      const isExternal = /^https?:\/\//.test(url);
      return (
        <a
          key={`${key}-${i}`}
          href={url}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-1 text-[var(--primary)] underline underline-offset-2 decoration-[var(--primary)]/30 hover:decoration-[var(--primary)] transition-colors"
        >
          {href}
          {isExternal && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
            </svg>
          )}
        </a>
      );
    }
    return <span key={`${key}-${i}`}>{part}</span>;
  });
}

export default function BlogBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];
  let list: { type: "ul" | "ol"; text: string }[] = [];

  const flushList = (key: number) => {
    if (list.length === 0) return key;
    const type = list[0].type;
    const items = list.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5 leading-[2] text-[15px] font-[700] text-[var(--text-2)]">
        <span
          className={`mt-[13px] w-[6px] h-[6px] rounded-full shrink-0 ${
            type === "ul" ? "bg-[var(--teal)]" : "bg-[var(--primary)]"
          }`}
        />
        <span>{renderInline(item.text, i)}</span>
      </li>
    ));
    blocks.push(
      type === "ul" ? (
        <ul key={key} className="space-y-1">{items}</ul>
      ) : (
        <ol key={key} className="space-y-1">{items}</ol>
      ),
    );
    list = [];
    return key + 1;
  };

  let key = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      key = flushList(key);
      continue;
    }
    if (line.startsWith("## ")) {
      key = flushList(key);
      blocks.push(
        <h2 key={key++} className="mt-8 text-[clamp(19px,2.2vw,24px)] font-[1000] text-[var(--text)]">
          {renderInline(line.slice(3), key)}
        </h2>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      key = flushList(key);
      blocks.push(
        <h3 key={key++} className="mt-6 text-[17px] font-[1000] text-[var(--text)]">
          {renderInline(line.slice(4), key)}
        </h3>,
      );
      continue;
    }
    if (/^[-•] /.test(line)) {
      list.push({ type: "ul", text: line.replace(/^[-•] /, "") });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      list.push({ type: "ol", text: line.replace(/^\d+\. /, "") });
      continue;
    }
    if (line.startsWith("> ")) {
      key = flushList(key);
      blocks.push(
        <blockquote
          key={key++}
          className="mt-6 border-r-4 border-[var(--primary)] bg-[var(--soft)] rounded-l-[14px] rounded-r-[6px] px-5 py-4 text-[15px] leading-[1.9] font-[800] text-[var(--text-2)]"
        >
          {renderInline(line.slice(2), key)}
        </blockquote>,
      );
      continue;
    }
    if (line.startsWith("---")) {
      key = flushList(key);
      blocks.push(<hr key={key++} className="mt-8 border-[var(--line-4)]" />);
      continue;
    }
    key = flushList(key);
    blocks.push(
      <p key={key++} className="text-[15px] leading-[2.05] font-[700] text-[var(--text-2)]">
        {renderInline(line, key)}
      </p>,
    );
  }
  flushList(key);

  return <div className="space-y-4">{blocks}</div>;
}
