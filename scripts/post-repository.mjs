import { randomBytes } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { comparePostRecency } from "../shared/post-order.js";

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" && fallback !== undefined) return structuredClone(fallback);
    throw error;
  }
}

async function backup(filePath, label, backupRoot) {
  try {
    await mkdir(backupRoot, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await copyFile(filePath, path.join(backupRoot, label + "-" + timestamp + ".json"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function writeJson(filePath, label, value, backupRoot) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await backup(filePath, label, backupRoot);
  const temporaryPath = filePath + "." + process.pid + "." + randomBytes(6).toString("hex") + ".tmp";
  await writeFile(temporaryPath, JSON.stringify(value, null, 2) + "\n", {
    encoding: "utf8",
    flush: true,
  });
  await rename(temporaryPath, filePath);
}

function assertPostArray(value, label) {
  if (!Array.isArray(value)) throw new Error(label + " must contain a JSON array.");
  return value;
}

function removeSlug(posts, slug) {
  return posts.filter((post) => post.slug !== slug);
}

export function createPostRepository({
  postsPath,
  draftsPath,
  backupRoot,
  preservePublicationTime,
}) {
  let mutationQueue = Promise.resolve();

  const serialize = (operation) => {
    const pending = mutationQueue.then(operation, operation);
    mutationQueue = pending.catch(() => {});
    return pending;
  };

  const readPublic = async () => assertPostArray(await readJson(postsPath, []), "content/posts.json");
  const readDrafts = async () => assertPostArray(await readJson(draftsPath, []), "the local draft store");

  const migrateDrafts = () => serialize(async () => {
    const [publicPosts, localDrafts] = await Promise.all([readPublic(), readDrafts()]);
    const misplacedDrafts = publicPosts.filter((post) => post.status !== "published");
    if (!misplacedDrafts.length) return { migrated: 0 };

    const nextPublicPosts = publicPosts.filter((post) => post.status === "published");
    const nextDrafts = [...localDrafts];
    for (const draft of misplacedDrafts) {
      const collision = nextDrafts.findIndex((post) => post.slug === draft.slug);
      if (collision >= 0) {
        if (JSON.stringify(nextDrafts[collision]) !== JSON.stringify(draft)) {
          const error = new Error(
            `Draft migration stopped because ${draft.slug} exists in both stores with different content.`,
          );
          error.status = 409;
          throw error;
        }
      } else nextDrafts.push(draft);
    }
    nextPublicPosts.sort(comparePostRecency);
    nextDrafts.sort(comparePostRecency);
    await Promise.all([
      writeJson(postsPath, "posts", nextPublicPosts, backupRoot),
      writeJson(draftsPath, "drafts", nextDrafts, backupRoot),
    ]);
    return { migrated: misplacedDrafts.length };
  });

  const list = async () => {
    const [publicPosts, localDrafts] = await Promise.all([readPublic(), readDrafts()]);
    return [...publicPosts, ...localDrafts].sort(comparePostRecency);
  };

  const save = (originalSlug, post) => serialize(async () => {
    const [publicPosts, localDrafts] = await Promise.all([readPublic(), readDrafts()]);
    const existing = [...publicPosts, ...localDrafts].find((item) => item.slug === originalSlug);
    const preserved = preservePublicationTime(post, existing);
    const collision = [...publicPosts, ...localDrafts].some(
      (item) => item.slug === preserved.slug && item.slug !== originalSlug,
    );
    if (collision) {
      const error = new Error("Another post already uses that slug.");
      error.status = 409;
      throw error;
    }

    const nextPublicPosts = removeSlug(publicPosts, originalSlug || preserved.slug);
    const nextDrafts = removeSlug(localDrafts, originalSlug || preserved.slug);
    if (preserved.status === "published") nextPublicPosts.push(preserved);
    else nextDrafts.push(preserved);
    nextPublicPosts.sort(comparePostRecency);
    nextDrafts.sort(comparePostRecency);

    await Promise.all([
      writeJson(postsPath, "posts", nextPublicPosts, backupRoot),
      writeJson(draftsPath, "drafts", nextDrafts, backupRoot),
    ]);
    return { post: preserved, created: !existing };
  });

  const remove = (slug) => serialize(async () => {
    const [publicPosts, localDrafts] = await Promise.all([readPublic(), readDrafts()]);
    const nextPublicPosts = removeSlug(publicPosts, slug);
    const nextDrafts = removeSlug(localDrafts, slug);
    if (nextPublicPosts.length === publicPosts.length && nextDrafts.length === localDrafts.length) {
      const error = new Error("Post not found.");
      error.status = 404;
      throw error;
    }
    await Promise.all([
      writeJson(postsPath, "posts", nextPublicPosts, backupRoot),
      writeJson(draftsPath, "drafts", nextDrafts, backupRoot),
    ]);
  });

  const find = async (slug) => (await list()).find((post) => post.slug === slug);

  return {
    find,
    list,
    migrateDrafts,
    remove,
    save,
  };
}
