import type { Metadata } from "next";
import { capabilities } from "../content";

export const metadata: Metadata = {
  title: "About",
  description: "Profile and methodology for a reverse engineering and malware analysis portfolio.",
};

export default function AboutPage() {
  return (
    <>
      <header className="page-hero">
        <div className="shell page-hero-grid">
          <div>
            <p className="eyebrow"><span>PROFILE</span> analyst record</p>
            <h1>About the lab</h1>
          </div>
          <p>A blank identity shell ready for a real analyst, their experience, and their preferred contact surface.</p>
        </div>
      </header>

      <div className="shell about-layout">
        <aside className="identity-card">
          <div className="large-logo-placeholder"><span>LOGO</span><small>blank</small></div>
          <dl>
            <div><dt>name</dt><dd>[ blank ]</dd></div>
            <div><dt>handle</dt><dd>[ blank ]</dd></div>
            <div><dt>location</dt><dd>[ blank ]</dd></div>
            <div><dt>availability</dt><dd><i /> configure</dd></div>
          </dl>
        </aside>

        <div className="about-copy">
          <p className="eyebrow"><span>01</span> analyst statement</p>
          <h2>I am interested in what software does after it stops being cooperative.</h2>
          <p className="about-lede">
            This space is designed for an analyst working across reverse engineering,
            malware triage, and detection research. Replace this paragraph with the
            path that brought you into low-level systems, the problems you enjoy, and
            the kind of work you want to pursue next.
          </p>

          <div className="principle-block">
            <h3>Operating principles</h3>
            <ol>
              <li><span>01</span><div><strong>Preserve the artifact.</strong><p>Hash first, work on copies, and keep transformations reproducible.</p></div></li>
              <li><span>02</span><div><strong>Separate observation from inference.</strong><p>Every conclusion should be traceable to a piece of evidence.</p></div></li>
              <li><span>03</span><div><strong>Prefer the smallest sufficient tool.</strong><p>Use automation to remove repetition, not to hide the reasoning.</p></div></li>
            </ol>
          </div>

          <div className="tool-matrix">
            <h3>Capability matrix</h3>
            {capabilities.map(([title, detail]) => (
              <div key={title}><span>{title}</span><p>{detail}</p><b>ready</b></div>
            ))}
          </div>

          <div className="about-contact">
            <p>IDENTIFIERS // NOT CONFIGURED</p>
            <div><span>github</span><strong>[ blank ]</strong></div>
            <div><span>email</span><strong>[ blank ]</strong></div>
            <div><span>resume</span><strong>[ blank ]</strong></div>
          </div>
        </div>
      </div>
    </>
  );
}
