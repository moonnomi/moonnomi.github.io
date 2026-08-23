import type { Metadata } from "next";
import { siteContent } from "../content";
import { ContentLink } from "../content-links";
import { VortexMark } from "../vortex-mark";

export const metadata: Metadata = {
  title: "About",
  description: "About this reverse engineering and malware analysis learning portfolio.",
};

export default function AboutPage() {
  const hasLinks = siteContent.links.length > 0;

  return (
    <div className="shell about-page">
      <header className="about-header">
        <VortexMark className="about-vortex" />
        <h1>About</h1>
      </header>

      <div className={`about-sheet${hasLinks ? "" : " about-sheet--single"}`}>
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

        {hasLinks && (
          <aside className="about-details" aria-label="Contact details">
            <h2>Contact</h2>
            <ul>
              {siteContent.links.map((link, index) => (
                <li key={`${link.label}-${link.url}-${index}`}>
                  <ContentLink link={link} placeholder={link.label.toLowerCase()} />
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
