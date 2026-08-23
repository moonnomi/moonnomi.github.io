import postsData from "../content/posts.json";
import siteData from "../content/site.json";
import { comparePostRecency } from "../shared/post-order.js";

export type NoteBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "evidence"; items: Array<[string, string]> }
  | { type: "image"; src: string; alt: string; caption: string; width: number; height: number }
  | { type: "code"; language: string; label: string; value: string };

export type NoteSection = {
  id: string;
  title: string;
  blocks?: NoteBlock[];
  /** Legacy fields are kept readable while existing JSON is migrated through the studio. */
  paragraphs?: string[];
  bullets?: string[];
  code?: {
    language: string;
    label: string;
    value: string;
  };
  evidence?: Array<[string, string]>;
};

export type LabNote = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  publishedAt?: string;
  readingTime: string;
  tags: string[];
  status: "draft" | "published";
  isSample?: boolean;
  sections: NoteSection[];
};

export type SiteLink = {
  label: string;
  url: string;
};

export type SiteContent = {
  name: string;
  role: string;
  introduction: string;
  footerTagline: string;
  aboutLead: string;
  aboutParagraphs: string[];
  learningTopics: string[];
  links: SiteLink[];
};

export const siteContent = siteData as SiteContent;
export const allNotes = postsData as unknown as LabNote[];
export const notes = allNotes
  .filter((note) => note.status === "published")
  .sort(comparePostRecency);
