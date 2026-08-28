import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

export class PublishError extends Error {}

function normalizeRemote(value) {
  return String(value)
    .trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

function run(command, args, { cwd, inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    if (!inherit) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new PublishError((stderr || stdout || `${command} exited with code ${code}.`).trim()));
    });
  });
}

async function runNpm(script, projectRoot) {
  if (process.platform === "win32") {
    const command = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    await run(command, ["/d", "/s", "/c", `npm run ${script}`], {
      cwd: projectRoot,
      inherit: true,
    });
    return;
  }
  await run("npm", ["run", script], { cwd: projectRoot, inherit: true });
}

function parseStatus(output) {
  const entries = output.split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const status = entry.slice(0, 2);
    if (/[RC]/.test(status)) {
      throw new PublishError("Renamed or copied files must be handled before publishing live.");
    }
    paths.push(entry.slice(3).replaceAll("\\", "/"));
  }
  return paths;
}

function isAllowedPostPath(filePath, slug) {
  return filePath === "content/posts.json" || filePath.startsWith(`public/posts/${slug}/`);
}

export function validatePublishPaths(paths, slug) {
  const unexpected = paths.filter((filePath) => !isAllowedPostPath(filePath, slug));
  if (unexpected.length) {
    throw new PublishError(
      "Publishing stopped because unrelated files are modified:\n" +
      unexpected.map((filePath) => "- " + filePath).join("\n"),
    );
  }
  if (!paths.length) throw new PublishError("There are no saved post changes to publish.");
  return paths;
}

export function changedPostSlugs(previousPosts, currentPosts) {
  const previous = new Map(previousPosts.map((post) => [post.slug, post]));
  const current = new Map(currentPosts.map((post) => [post.slug, post]));
  const slugs = new Set([...previous.keys(), ...current.keys()]);
  return [...slugs]
    .filter((slug) => JSON.stringify(previous.get(slug)) !== JSON.stringify(current.get(slug)))
    .sort();
}

async function publishingConfiguration(projectRoot) {
  const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
  const configured = packageJson.nomiPublishing ?? {};
  const repositoryUrl = typeof packageJson.repository === "string"
    ? packageJson.repository
    : packageJson.repository?.url;
  if (!repositoryUrl) throw new PublishError("package.json needs a repository URL before live publishing can be enabled.");
  return {
    branch: configured.branch || "main",
    remote: configured.remote || "origin",
    repositoryUrl,
  };
}

export async function publishLive({ projectRoot, slug, confirmed = false, dryRun = false }) {
  if (!confirmed) throw new PublishError("Live publishing requires explicit confirmation.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new PublishError("The post slug is invalid.");

  const posts = JSON.parse(await readFile(path.join(projectRoot, "content", "posts.json"), "utf8"));
  const post = posts.find((item) => item.slug === slug);
  if (!post || post.status !== "published") {
    throw new PublishError("Save the post with Published status before publishing it live.");
  }

  const configuration = await publishingConfiguration(projectRoot);
  const repositoryRoot = (await run("git", ["rev-parse", "--show-toplevel"], { cwd: projectRoot })).stdout.trim();
  if (path.resolve(repositoryRoot) !== path.resolve(projectRoot)) {
    throw new PublishError("Live publishing must run from the portfolio repository root.");
  }

  const branch = (await run("git", ["branch", "--show-current"], { cwd: projectRoot })).stdout.trim();
  if (branch !== configuration.branch) {
    throw new PublishError(`Switch to ${configuration.branch} before publishing live.`);
  }

  const remoteUrl = (await run("git", ["remote", "get-url", configuration.remote], { cwd: projectRoot })).stdout.trim();
  if (normalizeRemote(remoteUrl) !== normalizeRemote(configuration.repositoryUrl)) {
    throw new PublishError("The configured Git remote does not match package.json. Refusing to push.");
  }

  await run("git", ["fetch", "--quiet", configuration.remote, configuration.branch], { cwd: projectRoot });
  const divergence = (await run(
    "git",
    ["rev-list", "--left-right", "--count", `HEAD...${configuration.remote}/${configuration.branch}`],
    { cwd: projectRoot },
  )).stdout.trim().split(/\s+/).map(Number);
  if (divergence[0] || divergence[1]) {
    throw new PublishError(
      "The local branch and remote branch are not identical. Sync them manually before publishing live.",
    );
  }

  const status = await run("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: projectRoot });
  const changedPaths = validatePublishPaths(parseStatus(status.stdout), slug);
  const previousPosts = JSON.parse((await run(
    "git",
    ["show", "HEAD:content/posts.json"],
    { cwd: projectRoot },
  )).stdout);
  const changedSlugs = changedPostSlugs(previousPosts, posts);
  if (changedSlugs.length !== 1 || changedSlugs[0] !== slug) {
    throw new PublishError(
      "Publishing stopped because content/posts.json changes more than the selected post:\n" +
      changedSlugs.map((changedSlug) => "- " + changedSlug).join("\n"),
    );
  }

  await runNpm("lint", projectRoot);
  await runNpm("test", projectRoot);

  if (dryRun) {
    return {
      dryRun: true,
      changedPaths,
      message: "Checks passed. No commit or push was created.",
    };
  }

  await run("git", ["add", "--", ...changedPaths], { cwd: projectRoot });
  const staged = (await run("git", ["diff", "--cached", "--name-only", "-z"], { cwd: projectRoot })).stdout
    .split("\0")
    .filter(Boolean)
    .map((filePath) => filePath.replaceAll("\\", "/"));
  validatePublishPaths(staged, slug);

  const commitTitle = String(post.title).replace(/\s+/g, " ").trim();
  await run("git", ["commit", "-m", `Publish ${commitTitle}`], { cwd: projectRoot, inherit: true });
  await run(
    "git",
    ["push", configuration.remote, `HEAD:${configuration.branch}`],
    { cwd: projectRoot, inherit: true },
  );

  const repository = normalizeRemote(configuration.repositoryUrl);
  return {
    dryRun: false,
    changedPaths: staged,
    actionsUrl: repository + "/actions",
    liveUrl: `https://moonnomi.github.io/notes/${slug}`,
    message: "Pushed to GitHub. The Pages workflow is now deploying the site.",
  };
}
