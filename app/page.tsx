import Link from "next/link";
import { capabilities, notes, projects } from "./content";

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="shell hero-layout">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> reverse engineering · malware analysis</p>
            <h1>I turn hostile binaries into <em>readable evidence.</em></h1>
            <p className="hero-lede">
              A portfolio of technical investigations, deobfuscation notes, and
              detection experiments. Identity intentionally left unconfigured.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="#work">inspect casework <span>↘</span></Link>
              <Link className="button secondary" href="/notes">open field notes <span>→</span></Link>
            </div>
            <div className="identity-line" aria-label="Placeholder identity details">
              <span>analyst</span><strong>[ blank ]</strong>
              <span>location</span><strong>[ blank ]</strong>
            </div>
          </div>

          <aside className="specimen-panel" aria-label="Analysis specimen summary">
            <div className="panel-topline">
              <span>SPECIMEN // PORTFOLIO</span>
              <span className="live-label"><i /> LIVE</span>
            </div>
            <div className="specimen-visual" aria-hidden="true">
              <div className="hex-column">4D 5A 90 00<br />03 00 00 00<br />04 00 00 00<br />FF FF 00 00<br />B8 00 00 00</div>
              <div className="binary-map">
                <span style={{ width: "82%" }} />
                <span style={{ width: "44%" }} />
                <span className="hot" style={{ width: "68%" }} />
                <span style={{ width: "93%" }} />
                <span className="safe" style={{ width: "57%" }} />
                <span style={{ width: "76%" }} />
              </div>
              <div className="scanline" />
            </div>
            <dl className="specimen-data">
              <div><dt>profile</dt><dd>[ blank ]</dd></div>
              <div><dt>focus</dt><dd>malware // reversing</dd></div>
              <div><dt>evidence</dt><dd>{notes.length} public notes</dd></div>
              <div><dt>checksum</dt><dd>pending_identity</dd></div>
            </dl>
            <p className="specimen-warning"><span>!</span> Samples discussed in a controlled research context.</p>
          </aside>
        </div>
      </section>

      <div className="status-rail">
        <div className="shell status-items">
          <span><i className="emerald" /> static analysis</span>
          <span><i className="teal" /> behavior tracing</span>
          <span><i className="orange" /> detection research</span>
          <span className="status-tail">environment: isolated // notes: public</span>
        </div>
      </div>

      <section className="section" id="work">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span>02</span> selected work</p>
              <h2>Research modules</h2>
            </div>
            <p>Repeatable tools and workflows built around evidence preservation.</p>
          </div>

          <div className="project-list">
            {projects.map((project) => (
              <article className="project-row" key={project.code}>
                <div className="project-code">{project.code}</div>
                <div className="project-main">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ul>{project.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
                </div>
                <div className="project-state"><span>{project.status}</span><b>↗</b></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section notes-section">
        <div className="shell notes-layout">
          <div className="notes-intro">
            <p className="eyebrow"><span>03</span> field notes</p>
            <h2>Analysis log</h2>
            <p>
              Long-form breakdowns of the process between first observation and
              defensible conclusion.
            </p>
            <Link href="/notes">view all notes <span>→</span></Link>
          </div>
          <div className="note-list">
            {notes.map((note) => (
              <article className="note-card" key={note.slug}>
                <div className="note-meta">
                  <span>{note.caseId}</span><time>{note.date}</time><span>{note.readingTime}</span>
                </div>
                <h3><Link href={`/notes/${note.slug}`}>{note.title}</Link></h3>
                <p>{note.summary}</p>
                <div className="note-footer">
                  <ul>{note.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
                  <Link href={`/notes/${note.slug}`} aria-label={`Read ${note.title}`}>open case ↗</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section methodology-section">
        <div className="shell">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow"><span>04</span> operating method</p>
              <h2>From artifact to conclusion</h2>
            </div>
          </div>
          <div className="capability-grid">
            {capabilities.map(([title, description], index) => (
              <div className="capability" key={title}>
                <span>0{index + 1}</span><h3>{title}</h3><p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-strip">
        <div className="shell contact-inner">
          <div>
            <p className="eyebrow"><span>05</span> establish contact</p>
            <h2>Have an interesting binary?</h2>
          </div>
          <div className="contact-placeholder">
            <span>email</span><strong>[ blank placeholder ]</strong>
          </div>
        </div>
      </section>
    </>
  );
}
