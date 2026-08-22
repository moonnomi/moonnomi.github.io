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
        <div className="shell article-header-inner">
          <Link className="back-link" href="/notes">← evidence archive</Link>
          <p className="article-case">{note.caseId} // {note.classification}</p>
          <h1>{note.title}</h1>
          <p className="article-description">{note.summary}</p>
          <div className="article-meta">
            <time>{note.date}</time><span>{note.readingTime} read</span><span>{note.tags.map((tag) => `#${tag}`).join(" ")}</span>
          </div>
        </div>
      </header>

      <div className="shell article-layout">
        <div className="article-content">
          <div className="mobile-toc">
            <details><summary>case contents</summary>{note.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</details>
          </div>

          {note.sections.map((section, sectionIndex) => (
            <section id={section.id} className="article-section" key={section.id}>
              <h2><a href={`#${section.id}`}>§</a>{sectionIndex + 1}. {section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.evidence && (
                <dl className="evidence-table">
                  <div className="evidence-caption">OBSERVATION SET</div>
                  {section.evidence.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
              )}
              {section.bullets && <ul className="analysis-list">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
              {section.code && (
                <div className="code-block">
                  <div className="code-head"><span>{section.code.label}</span><span>{section.code.language}</span><CopyCode value={section.code.value} /></div>
                  <pre><code>{section.code.value}</code></pre>
                </div>
              )}
            </section>
          ))}

          <div className="article-disclaimer"><span>NOTE</span><p>Portfolio examples are written for defensive research and use sanitized or illustrative sample data.</p></div>

          <nav className="post-navigation" aria-label="Adjacent notes">
            {newer ? <Link href={`/notes/${newer.slug}`}><small>← newer case</small><span>{newer.title}</span></Link> : <span />}
            {older && <Link href={`/notes/${older.slug}`}><small>older case →</small><span>{older.title}</span></Link>}
          </nav>
        </div>

        <aside className="article-toc" aria-label="On this page">
          <p>CASE CONTENTS</p>
          <ol>{note.sections.map((section, sectionIndex) => <li key={section.id}><a href={`#${section.id}`}><span>0{sectionIndex + 1}</span>{section.title}</a></li>)}</ol>
          <div className="toc-status"><i /> analysis complete</div>
        </aside>
      </div>
    </article>
  );
}
