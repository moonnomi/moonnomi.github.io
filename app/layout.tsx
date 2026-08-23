import type { Metadata } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/public-sans";
import { notes, siteContent } from "./content";
import "./globals.css";
import { SiteFrame } from "./site-frame";

const description = siteContent.introduction;

const designContract = `<!--
THESIS: A beginner's growing body of work appears as one quiet reading-room catalogue, refusing the familiar terminal-blog stack.
OWN-WORLD: An onyx room holds platinum reading sheets with teal edges; a hand-redrawn teal vortex identifies nomi, Archivo leads, Public Sans reads, and mono is reserved for dates and code.
STORY: Visitors meet an honest learner, open the newest write-up, then scan the dated archive and read further.
FIRST VIEWPORT: A restrained logo-only header opens to a two-column room: identity and purpose on the left, one low-glare featured reading sheet on the right; a small chevron points toward the latest posts at the fold.
FORM: Night Reading Room, grounded direction 4, seed 7fdc7752.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  title: {
    default: siteContent.name,
    template: `%s | ${siteContent.name}`,
  },
  description,
  openGraph: {
    type: "website",
    title: siteContent.name,
    description,
  },
  twitter: {
    card: "summary",
    title: siteContent.name,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchItems = notes.map(({ slug, title, summary, tags }) => ({
    slug,
    title,
    summary,
    tags,
  }));

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <template aria-hidden="true" dangerouslySetInnerHTML={{ __html: designContract }} />
        <SiteFrame searchItems={searchItems}>{children}</SiteFrame>
      </body>
    </html>
  );
}
