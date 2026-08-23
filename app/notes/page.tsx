import type { Metadata } from "next";
import { notes } from "../content";
import { StaticLink } from "../static-link";

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
            <StaticLink className="catalog-entry-link" href={`/notes/${note.slug}`}>
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
            </StaticLink>
          </article>
        )) : <p className="catalog-empty">No published posts yet.</p>}
      </div>
    </div>
  );
}
