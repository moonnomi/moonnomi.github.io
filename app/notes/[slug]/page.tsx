import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCode } from "../../copy-code";
import { notes, type NoteBlock, type NoteSection } from "../../content";

function legacyBlocks(section: NoteSection): NoteBlock[] {
  return [
    ...(section.paragraphs ?? []).map((text): NoteBlock => ({ type: "paragraph", text })),
    ...(section.evidence?.length ? [{ type: "evidence" as const, items: section.evidence }] : []),
    ...(section.bullets?.length ? [{ type: "list" as const, items: section.bullets }] : []),
    ...(section.code ? [{ type: "code" as const, ...section.code }] : []),
  ];
}

function ArticleBlock({ block, index }: { block: NoteBlock; index: number }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "evidence") {
    return (
      <dl className="evidence-list">
        {block.items.map(([label, value]) => (
          <div key={`${index}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    );
  }
  if (block.type === "list") {
    return <ul className="article-list">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  }
  return (
    <div className="code-block">
      <div className="code-head">
        <span>{block.label}</span>
        <CopyCode value={block.value} />
      </div>
      <pre><code>{block.value}</code></pre>
    </div>
  );
}

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
    <article className="reading-room-article">
      <div className="shell article-paper">
        <header className="article-header">
          <Link className="back-link" href="/notes">Back to posts</Link>
          <h1>{note.title}</h1>
          <p className="article-summary">{note.summary}</p>
          <div className="article-meta">
            <time>{note.date}</time>
            <span>{note.readingTime} read</span>
            {note.isSample && <span>Sample write-up</span>}
          </div>
          <div className="tag-row article-tags">
            {note.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        </header>

        <details className="mobile-toc">
          <summary>Contents</summary>
          {note.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </details>

        <div className="article-layout">
          <div className="article-content">
            {note.sections.map((section) => (
              <section id={section.id} className="article-section" key={section.id}>
                <h2>{section.title}</h2>
                {(section.blocks ?? legacyBlocks(section)).map((block, blockIndex) => (
                  <ArticleBlock block={block} index={blockIndex} key={`${block.type}-${blockIndex}`} />
                ))}
              </section>
            ))}

            <nav className="post-navigation" aria-label="Adjacent write-ups">
              {newer ? <Link href={`/notes/${newer.slug}`}><small>Newer</small><span>{newer.title}</span></Link> : <span />}
              {older && <Link href={`/notes/${older.slug}`}><small>Older</small><span>{older.title}</span></Link>}
            </nav>
          </div>

          <aside className="article-toc" aria-label="Contents">
            <strong>Contents</strong>
            {note.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
          </aside>
        </div>
      </div>
    </article>
  );
}
