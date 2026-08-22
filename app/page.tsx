import Link from "next/link";
import { notes } from "./content";

export default function Home() {
  return (
    <>
      <section className="home-intro">
        <div className="shell">
          <div className="logo-placeholder" aria-label="Logo placeholder">[logo]</div>
          <h1>Hi, I&apos;m <span>[name]</span>.</h1>
          <p>I study reverse engineering and malware analysis, and write about the tools and techniques I learn.</p>
          <div className="profile-links" aria-label="Placeholder profile links">
            <span>[github]</span>
            <span>[email]</span>
            <span>[resume]</span>
          </div>
        </div>
      </section>

      <section className="recent-posts">
        <div className="shell">
          <div className="simple-heading">
            <h2>Latest posts</h2>
            <Link href="/notes">all posts</Link>
          </div>

          <div className="post-list">
            {notes.map((note) => (
              <article className="post-row" key={note.slug}>
                <div className="post-meta">
                  <time>{note.date}</time>
                  <span>{note.readingTime}</span>
                </div>
                <h3><Link href={`/notes/${note.slug}`}>{note.title}</Link></h3>
                <p>{note.summary}</p>
                <ul>{note.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
