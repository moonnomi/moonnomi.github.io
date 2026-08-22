import type { Metadata } from "next";
import { headers } from "next/headers";
import { notes } from "./content";
import "./globals.css";
import { SiteFrame } from "./site-frame";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "A reverse engineering and malware analysis portfolio presented as a dark evidence notebook.";

  return {
    title: {
      default: "[ IDENTITY ] // Reverse Engineering Lab",
      template: "%s // Analysis Lab",
    },
    description,
    openGraph: {
      type: "website",
      title: "[ IDENTITY ] // Reverse Engineering Lab",
      description,
      images: [{ url: `${origin}/og.png`, width: 1734, height: 910, alt: "Dark reverse engineering analysis lab cover" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "[ IDENTITY ] // Reverse Engineering Lab",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchItems = notes.map(({ slug, caseId, title, summary, tags }) => ({
    slug,
    caseId,
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
