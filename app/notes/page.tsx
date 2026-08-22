import type { Metadata } from "next";
import Link from "next/link";
import { notes } from "../content";

export const metadata: Metadata = {
  title: "Posts",
  description: "Posts about reverse engineering and malware analysis.",
};

export default function NotesPage() {
  return (
    <div className="content-shell listing-page">
      <header className="simple-page-header">
        <h1>Posts</h1>
        <p>Reverse engineering, malware analysis, and related tools.</p>
      </header>

      <div className="post-list">
        {notes.map((note) => (
          <article className="post-row" key={note.slug}>
            <div className="post-meta">
              <time>{note.date}</time>
              <span>{note.readingTime}</span>
            </div>
            <h2><Link href={`/notes/${note.slug}`}>{note.title}</Link></h2>
            <p>{note.summary}</p>
            <ul>{note.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}
