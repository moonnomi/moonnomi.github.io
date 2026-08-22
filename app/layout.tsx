import type { Metadata } from "next";
import { notes } from "./content";
import "./globals.css";
import { SiteFrame } from "./site-frame";

const description = "Notes about reverse engineering, malware analysis, and related tools.";

export const metadata: Metadata = {
  title: {
    default: "[name] // Reverse Engineering",
    template: "%s // [name]",
  },
  description,
  openGraph: {
    type: "website",
    title: "[name] // Reverse Engineering",
    description,
  },
  twitter: {
    card: "summary",
    title: "[name] // Reverse Engineering",
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
        <SiteFrame searchItems={searchItems}>{children}</SiteFrame>
      </body>
    </html>
  );
}
