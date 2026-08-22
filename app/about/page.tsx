import type { Metadata } from "next";
import { siteContent } from "../content";
import { ContentLink } from "../content-links";
import { VortexMark } from "../vortex-mark";

export const metadata: Metadata = {
  title: "About",
  description: "About this reverse engineering and malware analysis learning portfolio.",
};

export default function AboutPage() {
  return (
    <div className="shell about-page">
      <header className="about-header">
        <VortexMark className="about-vortex" />
        <h1>About</h1>
      </header>

      <div className="about-sheet">
        <div className="about-copy">
          <p className="about-lead">
            {siteContent.aboutLead}
          </p>
          {siteContent.aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

          <h2>What I am learning</h2>
          <ul>
            {siteContent.learningTopics.map((topic) => <li key={topic}>{topic}</li>)}
          </ul>
        </div>

        <aside className="about-details" aria-label="Placeholder contact details">
          <h2>Contact</h2>
          <dl>
            <div><dt>Email</dt><dd><ContentLink linkKey="email" link={siteContent.links.email} /></dd></div>
            <div><dt>GitHub</dt><dd><ContentLink linkKey="github" link={siteContent.links.github} /></dd></div>
            <div><dt>Resume</dt><dd><ContentLink linkKey="resume" link={siteContent.links.resume} /></dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
