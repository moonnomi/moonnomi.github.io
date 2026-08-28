import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  changedPostSlugs,
  PublishError,
  publishLive,
  validatePublishPaths,
} from "../scripts/live-publish.mjs";
import { runPostCli } from "../scripts/post-cli.mjs";
import { createPostRepository } from "../scripts/post-repository.mjs";
import { preservePublicationTime } from "../scripts/studio.mjs";

const execute = promisify(execFile);

test("the post CLI keeps drafts local until they are published", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "nomi-post-cli-test-"));
  const contentRoot = path.join(temporaryRoot, "content");
  const markdownPath = path.join(temporaryRoot, "writeup.md");

  try {
    await mkdir(contentRoot, { recursive: true });
    await writeFile(path.join(contentRoot, "posts.json"), "[]\n", "utf8");
    await writeFile(markdownPath, "## Initial look\n\nA test write-up.\n", "utf8");

    await runPostCli([
      "save",
      markdownPath,
      "--slug", "cli-draft",
      "--title", "CLI draft",
      "--summary", "A draft created without the browser.",
      "--tags", "test,cli",
    ], temporaryRoot);

    assert.deepEqual(JSON.parse(await readFile(path.join(contentRoot, "posts.json"), "utf8")), []);
    const drafts = JSON.parse(await readFile(path.join(temporaryRoot, ".nomi-studio", "drafts.json"), "utf8"));
    assert.equal(drafts[0].slug, "cli-draft");
    assert.equal(drafts[0].status, "draft");

    await runPostCli(["status", "cli-draft", "published"], temporaryRoot);
    const published = JSON.parse(await readFile(path.join(contentRoot, "posts.json"), "utf8"));
    assert.equal(published[0].slug, "cli-draft");
    assert.equal(published[0].status, "published");
    assert.deepEqual(
      JSON.parse(await readFile(path.join(temporaryRoot, ".nomi-studio", "drafts.json"), "utf8")),
      [],
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("draft migration refuses to overwrite a different local draft", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "nomi-draft-conflict-test-"));
  const postsPath = path.join(temporaryRoot, "posts.json");
  const draftsPath = path.join(temporaryRoot, "drafts.json");
  try {
    await writeFile(postsPath, JSON.stringify([
      { slug: "same-draft", title: "Tracked version", status: "draft" },
    ]) + "\n", "utf8");
    await writeFile(draftsPath, JSON.stringify([
      { slug: "same-draft", title: "Local version", status: "draft" },
    ]) + "\n", "utf8");
    const repository = createPostRepository({
      postsPath,
      draftsPath,
      backupRoot: path.join(temporaryRoot, "backups"),
      preservePublicationTime,
    });
    await assert.rejects(() => repository.migrateDrafts(), /exists in both stores/i);
    assert.match(await readFile(draftsPath, "utf8"), /Local version/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("live publishing refuses unrelated working-tree changes", () => {
  assert.deepEqual(
    validatePublishPaths([
      "content/posts.json",
      "public/posts/example-post/graph.png",
    ], "example-post"),
    ["content/posts.json", "public/posts/example-post/graph.png"],
  );
  assert.throws(
    () => validatePublishPaths(["content/posts.json", "app/layout.tsx"], "example-post"),
    PublishError,
  );
  assert.throws(
    () => validatePublishPaths(["public/posts/different-post/image.png"], "example-post"),
    PublishError,
  );
});

test("live publishing detects changes outside the selected post", () => {
  const previous = [
    { slug: "first", title: "Old title" },
    { slug: "second", title: "Unchanged" },
  ];
  const current = [
    { slug: "first", title: "New title" },
    { slug: "second", title: "Unchanged" },
    { slug: "third", title: "New post" },
  ];
  assert.deepEqual(changedPostSlugs(previous, current), ["first", "third"]);
});

test("a dry-run exercises the complete publish preflight without creating a commit", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "nomi-publish-dry-run-test-"));
  const projectRoot = path.join(temporaryRoot, "worktree");
  const remoteRoot = path.join(temporaryRoot, "origin.git");
  const runGit = (args, cwd = projectRoot) => execute("git", args, { cwd });

  try {
    await mkdir(path.join(projectRoot, "content"), { recursive: true });
    await runGit(["init", "--bare", remoteRoot], temporaryRoot);
    await runGit(["init", "--initial-branch=main"], projectRoot);
    await runGit(["config", "user.name", "Nomi test"], projectRoot);
    await runGit(["config", "user.email", "nomi-test@example.invalid"], projectRoot);
    await writeFile(path.join(projectRoot, "package.json"), JSON.stringify({
      name: "nomi-publish-test",
      private: true,
      repository: { type: "git", url: remoteRoot },
      nomiPublishing: { remote: "origin", branch: "main" },
      scripts: {
        lint: "node -e \"process.exit(0)\"",
        test: "node -e \"process.exit(0)\"",
      },
    }, null, 2) + "\n", "utf8");
    await writeFile(path.join(projectRoot, "content", "posts.json"), "[]\n", "utf8");
    await runGit(["add", "package.json", "content/posts.json"]);
    await runGit(["commit", "-m", "Initial fixture"]);
    await runGit(["remote", "add", "origin", remoteRoot]);
    await runGit(["push", "-u", "origin", "main"]);

    await writeFile(path.join(projectRoot, "content", "posts.json"), JSON.stringify([{
      slug: "dry-run-post",
      title: "Dry run post",
      status: "published",
    }], null, 2) + "\n", "utf8");
    const result = await publishLive({
      projectRoot,
      slug: "dry-run-post",
      confirmed: true,
      dryRun: true,
    });
    assert.equal(result.dryRun, true);
    assert.deepEqual(result.changedPaths, ["content/posts.json"]);
    assert.equal((await runGit(["rev-list", "--count", "HEAD"])).stdout.trim(), "1");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
