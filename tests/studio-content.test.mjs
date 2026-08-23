import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  markdownToSections,
  normalizePost,
  normalizeSite,
  preservePublicationTime,
  sectionsToMarkdown,
  startStudio,
} from "../scripts/studio.mjs";
import { comparePostRecency } from "../shared/post-order.js";
import { restoredEditorState } from "../studio/state-utils.js";

const orderedMarkdown = [
  "## Analysis",
  "",
  "Opening observation.",
  "",
  "```python decoder.py",
  "print('first')",
  "```",
  "",
  "A paragraph after the code block.",
  "",
  "- first check",
  "- second check",
  "",
  ":::evidence",
  "source: [original challenge](https://example.com/challenge)",
  "format: PE32",
  "confidence: medium",
  ":::",
  "",
  ":::image",
  "src: /posts/analysis/control-flow.png",
  "alt: Control-flow graph showing the success and failure branches.",
  "caption: The graph view made the two exits easier to compare.",
  "width: 1600",
  "height: 900",
  ":::",
  "",
  "```text note.txt",
  "second code block",
  "```",
].join("\n");

const siteFixture = {
  name: "nomi",
  role: "Reverse engineering and malware analysis",
  introduction: "A short introduction.",
  footerTagline: "A short footer.",
  aboutLead: "A short opening paragraph.",
  aboutParagraphs: ["A supporting paragraph."],
  learningTopics: ["Static analysis"],
};

test("Markdown sections preserve authored block order and repeated code blocks", () => {
  const sections = markdownToSections(orderedMarkdown);
  assert.deepEqual(
    sections[0].blocks.map((block) => block.type),
    ["paragraph", "code", "paragraph", "list", "evidence", "image", "code"],
  );
  assert.equal(sectionsToMarkdown(sections), orderedMarkdown);
});

test("post normalization retains the per-post sample flag", () => {
  const post = normalizePost({
    title: "A first note",
    slug: "a-first-note",
    summary: "A short summary.",
    date: "2026.08.22",
    tags: ["learning"],
    status: "draft",
    isSample: true,
    body: orderedMarkdown,
  });
  assert.equal(post.isSample, true);
  assert.equal(post.status, "draft");
});

test("post normalization rejects impossible calendar dates", () => {
  assert.throws(
    () => normalizePost({
      title: "Impossible date",
      summary: "A short summary.",
      date: "2026.02.31",
      body: orderedMarkdown,
    }),
    /real calendar date/i,
  );
});

test("publication timestamps resolve same-day post ordering", () => {
  const posts = [
    {
      slug: "older-post",
      date: "2026.08.23",
      publishedAt: "2026-08-23T07:58:19.000Z",
    },
    {
      slug: "newer-post",
      date: "2026.08.23",
      publishedAt: "2026-08-23T12:43:37.119Z",
    },
  ];

  posts.sort(comparePostRecency);
  assert.deepEqual(posts.map((post) => post.slug), ["newer-post", "older-post"]);
});

test("the studio assigns publication time once and preserves it on edits", () => {
  const draft = normalizePost({
    title: "A timed note",
    slug: "a-timed-note",
    summary: "A short summary.",
    date: "2026.08.23",
    tags: ["learning"],
    status: "published",
    body: orderedMarkdown,
  });
  const firstPublication = preservePublicationTime(
    draft,
    undefined,
    new Date("2026-08-23T12:43:37.119Z"),
  );
  const editedPublication = preservePublicationTime(
    { ...firstPublication, title: "An edited timed note" },
    firstPublication,
    new Date("2026-08-24T00:00:00.000Z"),
  );

  assert.equal(firstPublication.publishedAt, "2026-08-23T12:43:37.119Z");
  assert.equal(editedPublication.publishedAt, firstPublication.publishedAt);
});

test("site normalization accepts ordered custom social links", () => {
  const site = normalizeSite({
    ...siteFixture,
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/example" },
      { label: "Email", url: "name@example.com" },
      { label: "Resume", url: "/resume.pdf" },
      { label: "", url: "" },
    ],
  });
  assert.deepEqual(site.links, [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/example" },
    { label: "Email", url: "name@example.com" },
    { label: "Resume", url: "/resume.pdf" },
  ]);
});

test("site normalization keeps legacy link objects readable and rejects unsafe schemes", () => {
  const legacy = normalizeSite({
    ...siteFixture,
    links: {
      github: { label: "GitHub", url: "https://github.com/example" },
      email: { label: "Email", url: "" },
    },
  });
  assert.deepEqual(legacy.links.map((link) => link.label), ["GitHub", "Email"]);
  assert.throws(
    () => normalizeSite({
      ...siteFixture,
      links: [{ label: "Unsafe", url: "javascript:alert(1)" }],
    }),
    /safe https, http, mailto/i,
  );
});

test("discard restoration returns saved values and abandons a new draft", () => {
  const restoredPost = restoredEditorState({
    activeView: "posts",
    dirty: true,
    isNew: false,
    activePost: { slug: "saved", title: "Unsaved title" },
    savedPostSnapshot: { slug: "saved", title: "Saved title" },
    originalSlug: "saved",
    slugTouched: true,
  });
  assert.equal(restoredPost.activePost.title, "Saved title");
  assert.equal(restoredPost.dirty, false);

  const abandonedDraft = restoredEditorState({
    activeView: "posts",
    dirty: true,
    isNew: true,
    activePost: { slug: "new", title: "Unsaved draft" },
    savedPostSnapshot: null,
    originalSlug: "",
    slugTouched: true,
  });
  assert.equal(abandonedDraft.activePost, null);
  assert.equal(abandonedDraft.isNew, false);
});

test("public content policy filters drafts", async () => {
  const contentSource = await readFile(new URL("../app/content.ts", import.meta.url), "utf8");
  assert.match(contentSource, /filter\(\(note\) => note\.status === "published"\)/);
});

test("studio markup and behavior retain accessible state contracts", async () => {
  const [markup, behavior, styles, server] = await Promise.all([
    readFile(new URL("../studio/index.html", import.meta.url), "utf8"),
    readFile(new URL("../studio/studio.js", import.meta.url), "utf8"),
    readFile(new URL("../studio/studio.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/studio.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /id="preview-post-hint"/);
  assert.match(markup, /id="insert-image-button"/);
  assert.match(markup, /id="add-site-link"/);
  assert.match(markup, /id="site-links"/);
  assert.match(markup, /\[link text\]\(https:\/\/example\.com\)/);
  assert.doesNotMatch(markup, /id="github-url"|id="email-url"|id="resume-url"/);
  assert.doesNotMatch(markup, /id="preview-post-link"[^>]*href=/);
  assert.match(behavior, /event\.preventDefault\(\);\s*if \(studioState\.mutating\) return;/);
  assert.match(behavior, /\/api\/images/);
  assert.match(behavior, /window\.createImageBitmap\(file\)/);
  assert.match(behavior, /bitmap\.close\(\)/);
  assert.match(behavior, /data-link-action/);
  assert.match(behavior, /links\.splice\(index, 1\)/);
  assert.match(styles, /input:focus-visible[\s\S]*outline: 2px solid var\(--orange\)/);
  assert.match(server, /img-src 'self' blob:/);
});

test("authenticated image uploads are stored inside the post asset directory", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "nomi-image-test-"));
  const testContentRoot = path.join(temporaryRoot, "content");
  const testBackupRoot = path.join(temporaryRoot, "backups");
  const testPublicRoot = path.join(temporaryRoot, "public");
  const testPostsPath = path.join(testContentRoot, "posts.json");
  const testSitePath = path.join(testContentRoot, "site.json");
  const port = 31874;
  let server;

  try {
    await mkdir(testContentRoot, { recursive: true });
    await writeFile(testPostsPath, JSON.stringify([{ slug: "image-post" }]) + "\n", "utf8");
    await writeFile(testSitePath, JSON.stringify({ name: "nomi" }) + "\n", "utf8");
    server = await startStudio({
      port,
      password: "test-password",
      postsPath: testPostsPath,
      sitePath: testSitePath,
      backupRoot: testBackupRoot,
      publicRoot: testPublicRoot,
    });

    const origin = `http://127.0.0.1:${port}`;
    const login = await fetch(origin + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ password: "test-password" }),
    });
    const cookie = login.headers.get("set-cookie").split(";", 1)[0];
    const imageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const response = await fetch(origin + "/api/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: origin,
      },
      body: JSON.stringify({
        postSlug: "image-post",
        filename: "Graph Capture.PNG",
        mimeType: "image/png",
        data: imageData,
        width: 1,
        height: 1,
      }),
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.deepEqual(payload.image, {
      src: "/posts/image-post/graph-capture.png",
      width: 1,
      height: 1,
    });
    const stored = await readFile(path.join(testPublicRoot, "posts", "image-post", "graph-capture.png"));
    assert.deepEqual(stored, Buffer.from(imageData, "base64"));
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("authenticated site settings save ordered custom social links", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "nomi-links-test-"));
  const testContentRoot = path.join(temporaryRoot, "content");
  const testBackupRoot = path.join(temporaryRoot, "backups");
  const testPostsPath = path.join(testContentRoot, "posts.json");
  const testSitePath = path.join(testContentRoot, "site.json");
  const port = 31872;
  let server;

  try {
    await mkdir(testContentRoot, { recursive: true });
    await writeFile(testPostsPath, "[]\n", "utf8");
    await writeFile(testSitePath, JSON.stringify({ ...siteFixture, links: [] }) + "\n", "utf8");
    server = await startStudio({
      port,
      password: "test-password",
      postsPath: testPostsPath,
      sitePath: testSitePath,
      backupRoot: testBackupRoot,
    });

    const origin = `http://127.0.0.1:${port}`;
    const login = await fetch(origin + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ password: "test-password" }),
    });
    const cookie = login.headers.get("set-cookie").split(";", 1)[0];
    const response = await fetch(origin + "/api/site", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: origin,
      },
      body: JSON.stringify({
        ...siteFixture,
        links: [
          { label: "Discord", url: "https://discord.com/users/123" },
          { label: "LinkedIn", url: "https://www.linkedin.com/in/example" },
        ],
      }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload.site.links.map((link) => link.label), ["Discord", "LinkedIn"]);
    const stored = JSON.parse(await readFile(testSitePath, "utf8"));
    assert.deepEqual(stored.links, payload.site.links);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("serialized post writes reject duplicate concurrent submissions", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "nomi-studio-test-"));
  const testContentRoot = path.join(temporaryRoot, "content");
  const testBackupRoot = path.join(temporaryRoot, "backups");
  const testPostsPath = path.join(testContentRoot, "posts.json");
  const testSitePath = path.join(testContentRoot, "site.json");
  const port = 31873;
  let server;

  try {
    await mkdir(testContentRoot, { recursive: true });
    await writeFile(testPostsPath, "[]\n", "utf8");
    await writeFile(testSitePath, JSON.stringify({ name: "nomi" }) + "\n", "utf8");
    server = await startStudio({
      port,
      password: "test-password",
      postsPath: testPostsPath,
      sitePath: testSitePath,
      backupRoot: testBackupRoot,
    });

    const origin = `http://127.0.0.1:${port}`;
    const login = await fetch(origin + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ password: "test-password" }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";", 1)[0];
    const body = JSON.stringify({
      originalSlug: "",
      post: {
        title: "Concurrent draft",
        slug: "concurrent-draft",
        summary: "Only one copy should be stored.",
        date: "2026.08.22",
        tags: ["test"],
        status: "draft",
        isSample: false,
        body: orderedMarkdown,
      },
    });
    const submit = () => fetch(origin + "/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: origin,
      },
      body,
    });
    const responses = await Promise.all([submit(), submit()]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    const stored = JSON.parse(await readFile(testPostsPath, "utf8"));
    assert.equal(stored.length, 1);
    assert.equal(stored[0].status, "draft");
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
