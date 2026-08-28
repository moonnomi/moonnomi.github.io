import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const contentPosts = JSON.parse(
  readFileSync(new URL("../content/posts.json", import.meta.url), "utf8"),
);
const siteDetails = JSON.parse(
  readFileSync(new URL("../content/site.json", import.meta.url), "utf8"),
);
const publishedPost = contentPosts.find((post) => post.status === "published");
const draftPost = contentPosts.find((post) => post.status !== "published");
const richContentPost = contentPosts.find((post) => post.slug === "what-password-two-ways");
const portfolioStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const tocSource = readFileSync(new URL("../app/article-toc.tsx", import.meta.url), "utf8");
const frameSource = readFileSync(new URL("../app/site-frame.tsx", import.meta.url), "utf8");
const staticNavigationSources = [
  "../app/page.tsx",
  "../app/notes/page.tsx",
  "../app/notes/[slug]/page.tsx",
  "../app/site-frame.tsx",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Night Reading Room homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, /<title>nomi<\/title>/i);
  assert.doesNotMatch(html, /THESIS:|OWN-WORLD:|seed 7fdc7752/);
  assert.match(html, /I am a beginner documenting what I learn/);
  assert.match(html, /Just a beginner learning stuff\./);
  assert.match(html, /class="[^"]*home-vortex[^"]*"/);
  assert.match(html, /class="home-name"/);
  assert.match(html, /class="home-name-stage"/);
  assert.match(html, /class="[^"]*featured-sheet[^"]*"/);
  assert.match(html, /href="\/favicon\.svg\?v=2"/);
  assert.match(html, /content="https:\/\/moonnomi\.github\.io\/social-card\.png"/);
  assert.match(html, /aria-label="Jump to latest posts"/);
  assert.match(html, /<h2>Latest posts<\/h2>/);
  if (publishedPost) {
    assert.ok(html.includes(publishedPost.title));
  } else {
    assert.match(html, /No published posts yet\./);
  }
  assert.doesNotMatch(html, /Read write-up|View everything|More writing/);
  assert.doesNotMatch(html, /The current write-ups are sample content for the portfolio layout/);
  assert.doesNotMatch(html, /Building your site|react-loading-skeleton/);
});

test("server-renders public routes and keeps drafts private", async () => {
  const articlePost = richContentPost ?? publishedPost ?? draftPost;
  assert.ok(articlePost, "the content fixture needs at least one post");

  const [writingResponse, aboutResponse, articleResponse] = await Promise.all([
    render("/notes"),
    render("/about"),
    render(`/notes/${articlePost.slug}`),
  ]);

  assert.equal(writingResponse.status, 200);
  assert.equal(aboutResponse.status, 200);
  assert.equal(articleResponse.status, articlePost.status === "published" ? 200 : 404);

  const [writing, about, article] = await Promise.all([
    writingResponse.text(),
    aboutResponse.text(),
    articleResponse.text(),
  ]);

  assert.match(writing, /<h1>Posts<\/h1>/);
  assert.match(writing, /class="page-arrival"/);
  assert.match(writing, /href="\/favicon\.svg\?v=2"/);
  assert.match(about, /href="\/favicon\.svg\?v=2"/);
  assert.doesNotMatch(writing, /Notes from learning reverse engineering/);
  assert.ok(about.includes(siteDetails.aboutLead));
  for (const topic of siteDetails.learningTopics) assert.ok(about.includes(topic));

  for (const post of contentPosts.filter((item) => item.status !== "published")) {
    assert.ok(!writing.includes(post.title));
  }

  if (articlePost.status === "published") {
    assert.ok(article.includes(articlePost.title));
    assert.match(article, /class="[^"]*article-paper[^"]*"/);
    assert.match(article, /class="inline-code"/);
    assert.match(article, /class="inline-link"/);
    assert.match(article, /href="https:\/\/crackmes\.one\/crackme\/6a83e2f205a9e80a90724421"/);
    assert.match(article, /class="article-image"/);
    assert.match(article, /class="article-image-media"/);
    assert.doesNotMatch(article, /class="article-image-link"/);
    assert.match(article, /href="\/favicon\.svg\?v=2"/);
    assert.match(article, /On this page/);
    assert.match(article, /Back to posts/);
  }
});

test("the desktop article rail remains sticky and tracks the current section", () => {
  assert.match(portfolioStyles, /\.article-paper\s*\{[\s\S]*?overflow:\s*clip;/);
  assert.match(portfolioStyles, /\.article-toc\s*\{[\s\S]*?position:\s*sticky;/);
  assert.match(tocSource, /aria-current=\{activeId === section\.id \? "location"/);
  assert.match(tocSource, /addEventListener\("scroll", updateActiveSection/);
});

test("search and route arrivals retain the low-glare interaction treatment", () => {
  assert.match(portfolioStyles, /\.search-results a:hover,[\s\S]*?\.search-results a\.is-selected\s*\{[\s\S]*?border-inline-start-color:\s*var\(--teal\);[\s\S]*?background:\s*var\(--article-surface-raised\);/);
  assert.match(portfolioStyles, /\.search-heading button:hover\s*\{[\s\S]*?color:\s*var\(--teal\);/);
  assert.match(portfolioStyles, /\.page-arrival\s*\{[\s\S]*?animation:\s*page-arrival/);
  assert.match(frameSource, /<dialog[\s\S]*?aria-modal="true"/);
});

test("public navigation uses native links that work on static GitHub Pages", () => {
  for (const source of staticNavigationSources) {
    assert.doesNotMatch(source, /from ["']next\/link["']/);
  }
});

test("the GitHub Pages build emits every public route and discovery asset", () => {
  const expectedPaths = [
    "../dist/client/index.html",
    "../dist/client/about/index.html",
    "../dist/client/notes/index.html",
    "../dist/client/robots.txt",
    "../dist/client/sitemap.xml",
    "../dist/client/social-card.png",
    ...contentPosts
      .filter((post) => post.status === "published")
      .map((post) => `../dist/client/notes/${post.slug}/index.html`),
  ];

  for (const relativePath of expectedPaths) {
    assert.ok(existsSync(new URL(relativePath, import.meta.url)), `${relativePath} should exist`);
  }

  const sitemap = readFileSync(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8");
  assert.match(sitemap, /https:\/\/moonnomi\.github\.io\/notes\//);
  for (const post of contentPosts.filter((item) => item.status !== "published")) {
    assert.doesNotMatch(sitemap, new RegExp(post.slug));
  }
});
