"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchItem = {
  slug: string;
  caseId: string;
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
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems;
    return searchItems.filter((item) =>
      [item.caseId, item.title, item.summary, ...item.tags].join(" ").toLowerCase().includes(normalized),
    );
  }, [query, searchItems]);

  useEffect(() => {
    const savedTone = window.localStorage.getItem("analysis-lab-tone");
    if (savedTone === "graphite") document.documentElement.dataset.tone = "graphite";
  }, []);

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

  const toggleTone = () => {
    const next = document.documentElement.dataset.tone === "graphite" ? "black" : "graphite";
    document.documentElement.dataset.tone = next;
    window.localStorage.setItem("analysis-lab-tone", next);
  };

  const moveSelection = (direction: number) => {
    if (!results.length) return;
    setSelectedIndex((current) => (current + direction + results.length) % results.length);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">skip to evidence</a>
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label="Portfolio home">
            <span className="brand-mark" aria-label="Logo placeholder" />
            <span className="brand-copy">
              <strong>[ IDENTITY ]</strong>
              <small>reverse engineering lab</small>
            </span>
          </Link>

          <button className="menu-toggle control-button" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? "close" : "menu"}
          </button>

          <nav id="primary-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Primary navigation">
            <Link href="/#work" onClick={() => setMenuOpen(false)}>work</Link>
            <Link href="/notes" onClick={() => setMenuOpen(false)}>notes</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>about</Link>
            <button className="nav-search" type="button" onClick={() => { setSearchOpen(true); setMenuOpen(false); }}>
              search <kbd>⌘K</kbd>
            </button>
            <button className="tone-toggle control-button" type="button" onClick={toggleTone} aria-label="Toggle background tone">◐</button>
          </nav>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div>
            <p className="footer-signal"><span className="signal-dot" /> analysis environment online</p>
            <p className="footer-note">All identifying links and marks are intentionally left blank.</p>
          </div>
          <div className="placeholder-links" aria-label="Placeholder profile links">
            <span>github / [ blank ]</span>
            <span>email / [ blank ]</span>
            <span>social / [ blank ]</span>
          </div>
          <p className="footer-build">static evidence notebook // 2026</p>
        </div>
      </footer>

      {searchOpen && (
        <div className="command-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Search case notes">
            <div className="command-head">
              <span className="prompt-symbol">›</span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder="search cases, techniques, or tags"
                onChange={(event) => { setQuery(event.target.value); setSelectedIndex(0); }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") { event.preventDefault(); moveSelection(1); }
                  if (event.key === "ArrowUp") { event.preventDefault(); moveSelection(-1); }
                  if (event.key === "Enter" && results[selectedIndex]) window.location.href = `/notes/${results[selectedIndex].slug}`;
                }}
              />
              <button type="button" onClick={() => setSearchOpen(false)}>esc</button>
            </div>
            <div className="command-results">
              {results.length ? results.map((item, index) => (
                <Link key={item.slug} className={`command-result${selectedIndex === index ? " is-selected" : ""}`} href={`/notes/${item.slug}`} onMouseEnter={() => setSelectedIndex(index)} onClick={() => setSearchOpen(false)}>
                  <span>{item.caseId}</span>
                  <strong>{item.title}</strong>
                  <small>{item.tags.map((tag) => `#${tag}`).join(" ")}</small>
                </Link>
              )) : <p className="command-empty">No matching evidence found.</p>}
            </div>
            <div className="command-foot"><span>↑↓ select</span><span>↵ open</span><span>esc close</span></div>
          </section>
        </div>
      )}
    </>
  );
}
