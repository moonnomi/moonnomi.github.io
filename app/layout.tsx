import type { Metadata } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/public-sans";
import { notes, siteContent } from "./content";
import "./globals.css";
import { SiteFrame } from "./site-frame";

const description = siteContent.introduction;
const siteUrl = new URL("https://moonnomi.github.io");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  icons: {
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/favicon.svg?v=2",
  },
  title: {
    default: siteContent.name,
    template: `%s | ${siteContent.name}`,
  },
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteContent.name,
    title: siteContent.name,
    description,
    images: [
      {
        url: "/social-card.png",
        width: 1200,
        height: 630,
        alt: "nomi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteContent.name,
    description,
    images: ["/social-card.png"],
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
      <head>
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" sizes="any" />
        <link rel="shortcut icon" href="/favicon.svg?v=2" type="image/svg+xml" />
      </head>
      <body>
        <SiteFrame searchItems={searchItems}>{children}</SiteFrame>
      </body>
    </html>
  );
}
