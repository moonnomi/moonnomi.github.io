import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { publishLive } from "./live-publish.mjs";
import { createPostRepository } from "./post-repository.mjs";
import {
  normalizeImageUpload,
  normalizePost,
  preservePublicationTime,
  sectionsToMarkdown,
  writeUniqueImage,
} from "./studio.mjs";

const defaultProjectRoot = fileURLToPath(new URL("../", import.meta.url));
const imageMimeTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
]);

function localDate() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(".");
}

function parseArguments(argv) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }
    const separator = value.indexOf("=");
    if (separator >= 0) {
      options[value.slice(2, separator)] = value.slice(separator + 1);
      continue;
    }
    const name = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[name] = next;
      index += 1;
    } else {
      options[name] = true;
    }
  }
  return { positionals, options };
}

function required(value, message) {
  if (value === undefined || value === null || value === "") throw new Error(message);
  return value;
}

function tags(value, fallback = []) {
  if (value === undefined) return fallback;
  return String(value).split(",").map((tag) => tag.trim()).filter(Boolean);
}

function postEditorValue(post) {
  return {
    ...post,
    body: sectionsToMarkdown(post.sections),
  };
}

function postRepository(projectRoot) {
  const localRoot = path.join(projectRoot, ".nomi-studio");
  return createPostRepository({
    postsPath: path.join(projectRoot, "content", "posts.json"),
    draftsPath: path.join(localRoot, "drafts.json"),
    backupRoot: path.join(localRoot, "backups"),
    preservePublicationTime,
  });
}

async function saveMarkdown(projectRoot, positionals, options) {
  const source = path.resolve(required(positionals[0], "Provide the Markdown file to save."));
  const body = await readFile(source, "utf8");
  const repository = postRepository(projectRoot);
  await repository.migrateDrafts();
  if (options.status !== undefined && !new Set(["draft", "published"]).has(options.status)) {
    throw new Error("Status must be draft or published.");
  }
  const lookupSlug = options.slug ? String(options.slug) : "";
  const existing = lookupSlug ? await repository.find(lookupSlug) : undefined;
  const existingEditor = existing ? postEditorValue(existing) : {};
  const candidate = normalizePost({
    ...existingEditor,
    title: options.title ?? existingEditor.title,
    slug: options.slug ?? existingEditor.slug,
    summary: options.summary ?? existingEditor.summary,
    date: options.date ?? existingEditor.date ?? localDate(),
    tags: tags(options.tags, existingEditor.tags),
    status: options.status ?? existingEditor.status ?? "draft",
    isSample: options.sample === true ? true : existingEditor.isSample,
    body,
  });
  const result = await repository.save(existing?.slug ?? "", candidate);
  return result.post;
}

async function changeStatus(projectRoot, positionals) {
  const slug = required(positionals[0], "Provide the post slug.");
  const status = required(positionals[1], "Provide draft or published.");
  if (!new Set(["draft", "published"]).has(status)) throw new Error("Status must be draft or published.");
  const repository = postRepository(projectRoot);
  await repository.migrateDrafts();
  const existing = await repository.find(slug);
  if (!existing) throw new Error(`Post not found: ${slug}`);
  const candidate = normalizePost({ ...postEditorValue(existing), status });
  return (await repository.save(slug, candidate)).post;
}

function insertAfterLine(body, marker, imageBlock) {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const matches = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter((entry) => entry.line === String(marker).trim());
  if (!matches.length) throw new Error(`Could not find the exact --after line: ${marker}`);
  if (matches.length > 1) throw new Error(`The --after line occurs more than once: ${marker}`);
  lines.splice(matches[0].index + 1, 0, "", imageBlock);
  return lines.join("\n");
}

async function addImage(projectRoot, positionals, options) {
  const slug = required(positionals[0], "Provide the post slug.");
  const source = path.resolve(required(positionals[1], "Provide the image file."));
  const alt = required(options.alt, "Image alt text is required.");
  if (!options.after && !options.append) {
    throw new Error("Use --after \"matching text\" to place the image, or explicitly use --append.");
  }

  const repository = postRepository(projectRoot);
  await repository.migrateDrafts();
  const existing = await repository.find(slug);
  if (!existing) throw new Error(`Post not found: ${slug}`);

  const extension = path.extname(source).toLowerCase();
  const mimeType = imageMimeTypes.get(extension);
  if (!mimeType) throw new Error("Use a PNG, JPEG, GIF, or WebP image.");
  const [bytes, metadata] = await Promise.all([readFile(source), sharp(source).metadata()]);
  const upload = normalizeImageUpload({
    postSlug: slug,
    filename: path.basename(source),
    mimeType,
    data: bytes.toString("base64"),
    width: metadata.width,
    height: metadata.height,
  });
  const publicRoot = path.join(projectRoot, "public");
  const src = await writeUniqueImage(publicRoot, upload);
  const storedPath = path.join(publicRoot, ...src.split("/").filter(Boolean));
  const lines = [
    ":::image",
    "src: " + src,
    "alt: " + String(alt).replace(/\s+/g, " ").trim(),
    ...(options.caption ? ["caption: " + String(options.caption).replace(/\s+/g, " ").trim()] : []),
    "width: " + metadata.width,
    "height: " + metadata.height,
    ":::",
  ];
  const imageBlock = lines.join("\n");

  try {
    const editor = postEditorValue(existing);
    const body = options.after
      ? insertAfterLine(editor.body, String(options.after), imageBlock)
      : editor.body.trimEnd() + "\n\n" + imageBlock;
    const candidate = normalizePost({ ...editor, body });
    await repository.save(slug, candidate);
    return { src, width: metadata.width, height: metadata.height };
  } catch (error) {
    await unlink(storedPath).catch(() => {});
    throw error;
  }
}

function printHelp() {
  console.log(`nomi post CLI

Commands:
  list
  show <slug> [--body-only]
  save <writeup.md> --slug <slug> [--title <title>] [--summary <text>]
       [--date YYYY.MM.DD] [--tags a,b] [--status draft|published]
  status <slug> <draft|published>
  image <slug> <file> --alt <text> (--after <matching text> | --append)
       [--caption <text>]
  deploy <slug> --yes [--dry-run]

The deploy command runs lint and tests, stages only the public post data and that
post's image directory, commits, and pushes to main using your existing Git login.`);
}

export async function runPostCli(argv = process.argv.slice(2), projectRoot = defaultProjectRoot) {
  const [command, ...rest] = argv;
  const { positionals, options } = parseArguments(rest);
  const repository = postRepository(projectRoot);

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }
  if (command === "list") {
    await repository.migrateDrafts();
    const posts = await repository.list();
    for (const post of posts) console.log(`${post.status.padEnd(9)} ${post.slug}  ${post.title}`);
    return;
  }
  if (command === "show") {
    await repository.migrateDrafts();
    const slug = required(positionals[0], "Provide the post slug.");
    const post = await repository.find(slug);
    if (!post) throw new Error(`Post not found: ${slug}`);
    if (!options["body-only"]) {
      console.log(JSON.stringify({
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        date: post.date,
        tags: post.tags,
        status: post.status,
        isSample: Boolean(post.isSample),
      }, null, 2));
      console.log("\n--- body ---\n");
    }
    console.log(sectionsToMarkdown(post.sections));
    return;
  }
  if (command === "save") {
    const post = await saveMarkdown(projectRoot, positionals, options);
    console.log(`Saved ${post.status}: ${post.slug}`);
    return;
  }
  if (command === "status") {
    const post = await changeStatus(projectRoot, positionals);
    console.log(`Status changed to ${post.status}: ${post.slug}`);
    return;
  }
  if (command === "image") {
    const image = await addImage(projectRoot, positionals, options);
    console.log(`Inserted image: ${image.src}`);
    return;
  }
  if (command === "deploy") {
    const slug = required(positionals[0], "Provide the published post slug.");
    const result = await publishLive({
      projectRoot,
      slug,
      confirmed: options.yes === true,
      dryRun: options["dry-run"] === true,
    });
    console.log(result.message);
    if (result.actionsUrl) console.log("Actions: " + result.actionsUrl);
    if (result.liveUrl) console.log("Live URL: " + result.liveUrl);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  runPostCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
