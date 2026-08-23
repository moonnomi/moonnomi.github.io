import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contentPosts = JSON.parse(
  readFileSync(new URL("../content/posts.json", import.meta.url), "utf8"),
);
const publishedPost = contentPosts.find((post) => post.status === "published");
const draftPost = contentPosts.find((post) => post.status !== "published");

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
  assert.match(html, /Night Reading Room/);
  assert.match(html, /seed 7fdc7752/);
  assert.match(html, /I am a beginner documenting what I learn/);
  assert.match(html, /Just a beginner learning stuff\./);
  assert.match(html, /class="[^"]*home-vortex[^"]*"/);
  assert.match(html, /class="home-name"/);
  assert.match(html, /class="home-name-stage"/);
  assert.match(html, /class="[^"]*featured-sheet[^"]*"/);
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
  const articlePost = publishedPost ?? draftPost;
  assert.ok(articlePost, "the content fixture needs at least one post");

  const [writingResponse, aboutResponse, articleResponse] = await Promise.all([
    render("/notes"),
    render("/about"),
    render(`/notes/${articlePost.slug}`),
  ]);

  assert.equal(writingResponse.status, 200);
  assert.equal(aboutResponse.status, 200);
  assert.equal(articleResponse.status, publishedPost ? 200 : 404);

  const [writing, about, article] = await Promise.all([
    writingResponse.text(),
    aboutResponse.text(),
    articleResponse.text(),
  ]);

  assert.match(writing, /<h1>Posts<\/h1>/);
  assert.doesNotMatch(writing, /Notes from learning reverse engineering/);
  assert.match(about, /beginner currently learning reverse/);
  assert.match(about, /Writing reproducible technical notes/);

  for (const post of contentPosts.filter((item) => item.status !== "published")) {
    assert.ok(!writing.includes(post.title));
  }

  if (publishedPost) {
    assert.ok(article.includes(publishedPost.title));
    assert.match(article, /class="[^"]*article-paper[^"]*"/);
    assert.match(article, /Back to posts/);
  }
});
