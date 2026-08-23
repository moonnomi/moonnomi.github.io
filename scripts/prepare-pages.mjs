import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const clientRoot = path.join(projectRoot, "dist", "client");
const postsPath = path.join(projectRoot, "content", "posts.json");
const siteUrl = "https://moonnomi.github.io";

async function copyAsDirectoryIndex(relativeHtmlPath) {
  const sourcePath = path.join(clientRoot, relativeHtmlPath);
  const parsed = path.parse(relativeHtmlPath);
  const outputDirectory = path.join(clientRoot, parsed.dir, parsed.name);
  await mkdir(outputDirectory, { recursive: true });
  await copyFile(sourcePath, path.join(outputDirectory, "index.html"));
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xmlEntry(url, date) {
  const lastModified = date ? `\n    <lastmod>${escapeXml(date.replaceAll(".", "-"))}</lastmod>` : "";
  return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastModified}\n  </url>`;
}

async function preparePagesOutput() {
  await Promise.all([
    copyAsDirectoryIndex("about.html"),
    copyAsDirectoryIndex("notes.html"),
  ]);

  const notesDirectory = path.join(clientRoot, "notes");
  const noteFiles = await readdir(notesDirectory, { withFileTypes: true });
  await Promise.all(
    noteFiles
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => copyAsDirectoryIndex(path.join("notes", entry.name))),
  );

  const posts = JSON.parse(await readFile(postsPath, "utf8"));
  const publishedPosts = posts
    .filter((post) => post.status === "published")
    .sort((left, right) => right.date.localeCompare(left.date));
  const newestDate = publishedPosts[0]?.date;
  const sitemapEntries = [
    xmlEntry(`${siteUrl}/`, newestDate),
    xmlEntry(`${siteUrl}/notes/`, newestDate),
    xmlEntry(`${siteUrl}/about/`),
    ...publishedPosts.map((post) => xmlEntry(`${siteUrl}/notes/${post.slug}/`, post.date)),
  ];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries,
    "</urlset>",
    "",
  ].join("\n");
  const robots = [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  await Promise.all([
    writeFile(path.join(clientRoot, "sitemap.xml"), sitemap, "utf8"),
    writeFile(path.join(clientRoot, "robots.txt"), robots, "utf8"),
    writeFile(path.join(clientRoot, ".nojekyll"), "", "utf8"),
  ]);
}

await preparePagesOutput();
