import type { Metadata } from "next";
import Link from "next/link";
import { notes } from "../content";

export const metadata: Metadata = {
  title: "Posts",
  description: "Learning notes about reverse engineering and malware analysis.",
};

export default function NotesPage() {
  return (
    <div className="shell archive-page">
      <header className="archive-header">
        <h1>Posts</h1>
      </header>

      <div className="catalog-list archive-catalog">
        {notes.length ? notes.map((note) => (
          <article className="catalog-entry" key={note.slug}>
            <Link className="catalog-entry-link" href={`/notes/${note.slug}`}>
              <div className="catalog-date">
                <time>{note.date}</time>
                <span>{note.readingTime}</span>
                {note.isSample && <span>Sample</span>}
              </div>
              <div className="catalog-copy">
                <h2>{note.title}</h2>
                <p>{note.summary}</p>
              </div>
              <div className="tag-row catalog-tags">
                {note.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
            </Link>
          </article>
        )) : <p className="catalog-empty">No published posts yet.</p>}
      </div>
    </div>
  );
}
