"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { siteContent } from "./content";
import { ContentLinks } from "./content-links";
import { VortexMark } from "./vortex-mark";

type SearchItem = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
};

export function SiteFrame({ children, searchItems }: { children: ReactNode; searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchSheetRef = useRef<HTMLDialogElement>(null);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return searchItems;
    return searchItems.filter((item) =>
      [item.title, item.summary, ...item.tags].join(" ").toLowerCase().includes(value),
    );
  }, [query, searchItems]);

  const closeSearch = (restoreFocus = true) => {
    setSearchOpen(false);
    if (restoreFocus) requestAnimationFrame(() => searchButtonRef.current?.focus());
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable;

      if ((event.key === "/" && !isTyping) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setSelectedIndex(0);
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [searchOpen]);

  const moveSelection = (direction: number) => {
    if (!results.length) return;
    setSelectedIndex((current) => (current + direction + results.length) % results.length);
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = searchSheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className={`site-header${pathname === "/" ? " site-header--home" : ""}`}>
        <div className="shell header-inner">
          <Link className="brand" href="/">
            <VortexMark className="brand-vortex" />
            <span>{siteContent.name}</span>
          </Link>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

          <nav id="primary-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Primary navigation">
            <Link href="/notes" onClick={() => setMenuOpen(false)}>Writing</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <button
              ref={searchButtonRef}
              type="button"
              aria-expanded={searchOpen}
              aria-controls="site-search"
              onClick={() => {
                setSelectedIndex(0);
                setSearchOpen(true);
                setMenuOpen(false);
              }}
            >
              Search
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="footer-identity">
            <VortexMark className="footer-vortex" />
            <div className="footer-copy">
              <strong>{siteContent.name}</strong>
              <span>{siteContent.footerTagline}</span>
            </div>
          </div>
          <div className="footer-links" aria-label="Contact details">
            <ContentLinks links={siteContent.links} />
          </div>
        </div>
      </footer>

      {searchOpen && (
        <>
          <button className="search-dismiss" type="button" aria-label="Close search" onClick={() => closeSearch()} />
          <dialog
            open
            id="site-search"
            ref={searchSheetRef}
            className="search-sheet"
            aria-labelledby="search-title"
            onKeyDown={handleSearchKeyDown}
          >
            <div className="shell search-sheet-inner">
              <div className="search-heading">
                <h2 id="search-title">Search writing</h2>
                <button type="button" onClick={() => closeSearch()}>Close</button>
              </div>

              <div className="search-input-row">
                <label htmlFor="search-input">Title, summary, or topic</label>
                <input
                  id="search-input"
                  ref={inputRef}
                  type="search"
                  value={query}
                  placeholder="Try: unpacking"
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
              </div>

              <div className="search-results" aria-live="polite">
                {results.length ? results.map((item, index) => (
                  <Link
                    key={item.slug}
                    className={selectedIndex === index ? "is-selected" : ""}
                    href={`/notes/${item.slug}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => closeSearch(false)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                  </Link>
                )) : <p>No matching write-ups. Try a broader topic.</p>}
              </div>
            </div>
          </dialog>
        </>
      )}
    </>
  );
}
