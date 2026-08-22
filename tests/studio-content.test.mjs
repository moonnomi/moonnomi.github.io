import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  markdownToSections,
  normalizePost,
  sectionsToMarkdown,
  startStudio,
} from "../scripts/studio.mjs";
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
  "format: PE32",
  "confidence: medium",
  ":::",
  "",
  "```text note.txt",
  "second code block",
  "```",
].join("\n");

test("Markdown sections preserve authored block order and repeated code blocks", () => {
  const sections = markdownToSections(orderedMarkdown);
  assert.deepEqual(
    sections[0].blocks.map((block) => block.type),
    ["paragraph", "code", "paragraph", "list", "evidence", "code"],
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
  const [markup, behavior, styles] = await Promise.all([
    readFile(new URL("../studio/index.html", import.meta.url), "utf8"),
    readFile(new URL("../studio/studio.js", import.meta.url), "utf8"),
    readFile(new URL("../studio/studio.css", import.meta.url), "utf8"),
  ]);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /id="preview-post-hint"/);
  assert.doesNotMatch(markup, /id="preview-post-link"[^>]*href=/);
  assert.match(behavior, /event\.preventDefault\(\);\s*if \(studioState\.mutating\) return;/);
  assert.match(styles, /input:focus-visible[\s\S]*outline: 2px solid var\(--orange\)/);
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
