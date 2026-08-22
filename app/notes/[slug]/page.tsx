import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCode } from "../../copy-code";
import { notes } from "../../content";

export function generateStaticParams() {
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const note = notes.find((item) => item.slug === slug);
  if (!note) return {};
  return { title: note.title, description: note.summary };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = notes.find((item) => item.slug === slug);
  if (!note) notFound();

  const index = notes.findIndex((item) => item.slug === slug);
  const newer = index > 0 ? notes[index - 1] : undefined;
  const older = index < notes.length - 1 ? notes[index + 1] : undefined;

  return (
    <article>
      <header className="article-header">
        <div className="content-shell">
          <Link className="back-link" href="/notes">Back to posts</Link>
          <h1>{note.title}</h1>
          <p>{note.summary}</p>
          <div className="article-meta">
            <time>{note.date}</time>
            <span>{note.readingTime} read</span>
            <span>{note.tags.map((tag) => `#${tag}`).join(" ")}</span>
          </div>
        </div>
      </header>

      <div className="article-layout">
        <div className="article-content">
          <details className="mobile-toc">
            <summary>Contents</summary>
            {note.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
          </details>

          {note.sections.map((section) => (
            <section id={section.id} className="article-section" key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.evidence && (
                <dl className="evidence-list">
                  {section.evidence.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              )}
              {section.bullets && <ul className="article-list">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
              {section.code && (
                <div className="code-block">
                  <div className="code-head">
                    <span>{section.code.label}</span>
                    <CopyCode value={section.code.value} />
                  </div>
                  <pre><code>{section.code.value}</code></pre>
                </div>
              )}
            </section>
          ))}

          <nav className="post-navigation" aria-label="Adjacent posts">
            {newer ? <Link href={`/notes/${newer.slug}`}><small>Newer</small><span>{newer.title}</span></Link> : <span />}
            {older && <Link href={`/notes/${older.slug}`}><small>Older</small><span>{older.title}</span></Link>}
          </nav>
        </div>

        <aside className="article-toc" aria-label="Contents">
          <strong>Contents</strong>
          {note.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </aside>
      </div>
    </article>
  );
}
