import assert from "node:assert/strict";
import test from "node:test";

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
  assert.match(html, /<title>nomi \| Learning notes<\/title>/i);
  assert.match(html, /Night Reading Room/);
  assert.match(html, /seed 7fdc7752/);
  assert.match(html, /I am a beginner documenting what I learn/);
  assert.match(html, /Just a beginner learning stuff\./);
  assert.match(html, /class="[^"]*home-vortex[^"]*"/);
  assert.match(html, /class="home-name"/);
  assert.match(html, /class="home-name-stage"/);
  assert.match(html, /class="featured-sheet"/);
  assert.doesNotMatch(html, /The current write-ups are sample content for the portfolio layout/);
  assert.doesNotMatch(html, /Building your site|react-loading-skeleton/);
});

test("server-renders the writing, about, and article routes", async () => {
  const [writingResponse, aboutResponse, articleResponse] = await Promise.all([
    render("/notes"),
    render("/about"),
    render("/notes/staged-loader-static-triage"),
  ]);

  assert.equal(writingResponse.status, 200);
  assert.equal(aboutResponse.status, 200);
  assert.equal(articleResponse.status, 200);

  const [writing, about, article] = await Promise.all([
    writingResponse.text(),
    aboutResponse.text(),
    articleResponse.text(),
  ]);

  assert.match(writing, /<h1>Writing<\/h1>/);
  assert.match(writing, />Sample</i);
  assert.match(about, /beginner currently learning reverse/);
  assert.match(about, /Writing reproducible technical notes/);
  assert.match(article, /Sample write-up/);
  assert.match(article, /class="[^"]*article-paper[^"]*"/);
  assert.match(article, /Back to writing/);
});
