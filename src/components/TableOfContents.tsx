"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heading } from "@/lib/toc";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -66%", threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      className="hidden lg:block sticky top-[100px] max-h-[70vh] overflow-y-auto pr-2"
      aria-label="Table of Contents"
    >
      <h3 className="text-[12px] font-[950] text-[var(--muted-3)] uppercase tracking-wider mb-3">
        در این مقاله
      </h3>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li
            key={h.id}
            className={`pl-3 border-r-2 transition-colors ${
              h.level === 3 ? "ml-4 border-[var(--line-4)]" : "border-[var(--primary)]"
            } ${activeId === h.id ? "border-opacity-100" : "border-opacity-30"}`}
          >
            <Link
              href={`#${h.id}`}
              className={`block py-1 text-[13px] font-[700] transition-colors ${
                activeId === h.id
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-4)] hover:text-[var(--primary)]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(h.id);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                  history.pushState(null, "", `#${h.id}`);
                  setActiveId(h.id);
                }
              }}
            >
              {h.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}