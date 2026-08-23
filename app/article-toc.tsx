"use client";

import { useEffect, useState } from "react";

type ArticleTocSection = {
  id: string;
  title: string;
};

export function ArticleToc({ sections }: { sections: ArticleTocSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const readingLine = 140;
        let nextId = sections[0]?.id ?? "";

        for (const section of sections) {
          const element = document.getElementById(section.id);
          if (!element || element.getBoundingClientRect().top > readingLine) break;
          nextId = section.id;
        }

        setActiveId((current) => current === nextId ? current : nextId);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  return (
    <aside className="article-toc">
      <strong>On this page</strong>
      <nav aria-label="On this page">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={activeId === section.id ? "location" : undefined}
          >
            {section.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
