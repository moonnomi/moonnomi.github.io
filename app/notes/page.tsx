import type { Metadata } from "next";
import Link from "next/link";
import { notes } from "../content";

export const metadata: Metadata = {
  title: "Field Notes",
  description: "Reverse engineering, malware analysis, and detection engineering case notes.",
};

export default function NotesPage() {
  const tags = [...new Set(notes.flatMap((note) => note.tags))].sort();

  return (
    <>
      <header className="page-hero">
        <div className="shell page-hero-grid">
          <div>
            <p className="eyebrow"><span>INDEX</span> evidence archive</p>
            <h1>Field notes</h1>
          </div>
          <p>Process-heavy writeups covering disassembly, deobfuscation, configuration recovery, and detection logic.</p>
        </div>
      </header>

      <div className="shell archive-layout">
        <aside className="archive-aside">
          <p className="aside-label">FILTER VOCABULARY</p>
          <div className="tag-index">{tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <p className="aside-note">Use <kbd>/</kbd> anywhere to search the archive.</p>
        </aside>
        <section className="archive-list" aria-label="All field notes">
          {notes.map((note, index) => (
            <article className="archive-entry" key={note.slug}>
              <span className="archive-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="note-meta"><span>{note.caseId}</span><time>{note.date}</time><span>{note.classification}</span></div>
                <h2><Link href={`/notes/${note.slug}`}>{note.title}</Link></h2>
                <p>{note.summary}</p>
                <ul>{note.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
              </div>
              <Link className="archive-open" href={`/notes/${note.slug}`}>open ↗</Link>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
