"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchItem = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
};

export function SiteFrame({ children, searchItems }: { children: ReactNode; searchItems: SearchItem[] }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return searchItems;
    return searchItems.filter((item) =>
      [item.title, item.summary, ...item.tags].join(" ").toLowerCase().includes(value),
    );
  }, [query, searchItems]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable;

      if ((event.key === "/" && !isTyping) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    setSelectedIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [searchOpen]);

  const moveSelection = (direction: number) => {
    if (!results.length) return;
    setSelectedIndex((current) => (current + direction + results.length) % results.length);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/">~/[username]</Link>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "close" : "menu"}
          </button>

          <nav id="primary-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Primary navigation">
            <Link href="/notes" onClick={() => setMenuOpen(false)}>posts/</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>about/</Link>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                setMenuOpen(false);
              }}
            >
              search
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <span>[name]</span>
          <div>
            <span>github: [blank]</span>
            <span>email: [blank]</span>
          </div>
        </div>
      </footer>

      {searchOpen && (
        <div
          className="search-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search posts">
            <div className="search-input-row">
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder="Search posts"
                aria-label="Search posts"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveSelection(1);
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveSelection(-1);
                  }
                  if (event.key === "Enter" && results[selectedIndex]) {
                    window.location.href = `/notes/${results[selectedIndex].slug}`;
                  }
                }}
              />
              <button type="button" onClick={() => setSearchOpen(false)}>close</button>
            </div>

            <div className="search-results">
              {results.length ? results.map((item, index) => (
                <Link
                  key={item.slug}
                  className={selectedIndex === index ? "is-selected" : ""}
                  href={`/notes/${item.slug}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => setSearchOpen(false)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                </Link>
              )) : <p>No matching posts.</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
