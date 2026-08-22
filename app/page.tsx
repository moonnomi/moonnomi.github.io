import Link from "next/link";
import { notes, siteContent } from "./content";
import { ContentLinks } from "./content-links";
import { TypedName } from "./typed-name";
import { VortexMark } from "./vortex-mark";

export default function Home() {
  const [featured, ...moreNotes] = notes;

  return (
    <>
      <section className="home-room">
        <div className="shell home-room-grid">
          <div className="home-profile">
            <VortexMark animated className="home-vortex" />
            <TypedName name={siteContent.name} />
            <p className="home-role">{siteContent.role}</p>
            <p className="home-introduction">{siteContent.introduction}</p>
            <div className="profile-links" aria-label="Profile details">
              <ContentLinks links={siteContent.links} />
            </div>
          </div>

          {featured ? (
            <Link className="featured-sheet" href={`/notes/${featured.slug}`}>
              <div className="featured-meta">
                <time>{featured.date}</time>
                <span>{featured.readingTime}</span>
              </div>
              <h2>{featured.title}</h2>
              <p>{featured.summary}</p>
              <div className="featured-footer">
                <div className="tag-row">
                  {featured.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
                <span>Read write-up</span>
              </div>
            </Link>
          ) : (
            <div className="featured-sheet featured-sheet-empty">
              <h2>No published writing yet.</h2>
              <p>New notes will appear here after they are published.</p>
            </div>
          )}
        </div>
      </section>

      <section className="writing-index">
        <div className="shell">
          <div className="section-title-row">
            <h2>More writing</h2>
            <Link href="/notes">View everything</Link>
          </div>

          <div className="catalog-list">
            {moreNotes.length ? moreNotes.map((note) => (
              <article className="catalog-entry" key={note.slug}>
                <Link className="catalog-entry-link" href={`/notes/${note.slug}`}>
                  <div className="catalog-date">
                    <time>{note.date}</time>
                    <span>{note.readingTime}</span>
                  </div>
                  <div className="catalog-copy">
                    <h3>{note.title}</h3>
                    <p>{note.summary}</p>
                  </div>
                  <div className="tag-row catalog-tags">
                    {note.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                  </div>
                </Link>
              </article>
            )) : <p className="catalog-empty">More writing will appear here over time.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
