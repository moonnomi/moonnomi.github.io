import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About this reverse engineering and malware analysis portfolio.",
};

export default function AboutPage() {
  return (
    <div className="content-shell about-page">
      <header className="simple-page-header">
        <h1>About</h1>
      </header>

      <div className="about-content">
        <p>
          My name is <strong>[name]</strong>. I am interested in reverse engineering,
          malware analysis, and low-level software.
        </p>
        <p>
          This site is a place for project notes, technical writeups, and things I
          want to remember. Replace this text with a short personal introduction.
        </p>

        <h2>Interests</h2>
        <ul>
          <li>Static and dynamic malware analysis</li>
          <li>Binary exploitation and deobfuscation</li>
          <li>Detection engineering</li>
          <li>Windows internals</li>
        </ul>

        <h2>Contact</h2>
        <dl>
          <div><dt>Email</dt><dd>[blank]</dd></div>
          <div><dt>GitHub</dt><dd>[blank]</dd></div>
          <div><dt>Resume</dt><dd>[blank]</dd></div>
        </dl>
      </div>
    </div>
  );
}
