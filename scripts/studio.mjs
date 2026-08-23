import { randomBytes, timingSafeEqual } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const studioRoot = path.join(projectRoot, "studio");
const contentRoot = path.join(projectRoot, "content");
const backupRoot = path.join(projectRoot, ".nomi-studio", "backups");
const postsPath = path.join(contentRoot, "posts.json");
const sitePath = path.join(contentRoot, "site.json");
const publicRoot = path.join(projectRoot, "public");
const markdownFence = String.fromCharCode(96).repeat(3);
const maximumImageBytes = 8 * 1024 * 1024;
const imageTypes = new Map([
  ["image/png", { extension: ".png", signature: (bytes) => bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) }],
  ["image/jpeg", { extension: ".jpg", signature: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/gif", { extension: ".gif", signature: (bytes) => ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii")) }],
  ["image/webp", { extension: ".webp", signature: (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" }],
]);

try {
  process.loadEnvFile(path.join(projectRoot, ".env.local"));
} catch {
  // A local env file is optional. An ephemeral password is printed when absent.
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function constantTimeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator < 0) return [part, ""];
        return [
          decodeURIComponent(part.slice(0, separator)),
          decodeURIComponent(part.slice(separator + 1)),
        ];
      }),
  );
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function requireString(value, label, maxLength) {
  const result = String(value ?? "").trim();
  if (!result) throw new RequestError(400, label + " is required.");
  if (result.length > maxLength) {
    throw new RequestError(400, label + " must be " + maxLength + " characters or fewer.");
  }
  return result;
}

function optionalString(value, maxLength) {
  const result = String(value ?? "").trim();
  if (result.length > maxLength) {
    throw new RequestError(400, "A field exceeds the " + maxLength + "-character limit.");
  }
  return result;
}

function uniqueSectionId(title, usedIds) {
  const base = slugify(title) || "section";
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = base + "-" + suffix;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function normalizeImageSource(value) {
  const source = requireString(value, "Image source", 500);
  if (
    !source.startsWith("/") ||
    source.startsWith("//") ||
    source.includes("\\") ||
    source.includes("?") ||
    source.includes("#") ||
    path.posix.normalize(source) !== source ||
    !/^\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|gif|webp)$/i.test(source)
  ) {
    throw new RequestError(400, "Image sources must be safe site-relative PNG, JPEG, GIF, or WebP paths.");
  }
  return source;
}

function normalizeImageDimension(value, label) {
  const dimension = Number(value);
  if (!Number.isInteger(dimension) || dimension < 1 || dimension > 20_000) {
    throw new RequestError(400, label + " must be a whole number between 1 and 20000.");
  }
  return dimension;
}

export function markdownToSections(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, "\n").split("\n");
  const sections = [];
  const usedIds = new Set();
  let section = null;
  let paragraphLines = [];

  const ensureSection = () => {
    if (!section) {
      section = { id: uniqueSectionId("Notes", usedIds), title: "Notes" };
    }
    return section;
  };

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    paragraphLines = [];
    if (!paragraph) return;
    const current = ensureSection();
    current.blocks ??= [];
    current.blocks.push({ type: "paragraph", text: paragraph });
  };

  const flushSection = () => {
    flushParagraph();
    if (section) sections.push(section);
    section = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flushSection();
      const title = requireString(heading[1], "Section title", 120);
      section = { id: uniqueSectionId(title, usedIds), title };
      continue;
    }

    if (line.startsWith(markdownFence)) {
      flushParagraph();
      const current = ensureSection();
      const info = line.slice(3).trim().split(/\s+/).filter(Boolean);
      const language = info.shift() || "text";
      const label = info.join(" ") || "snippet." + (language === "text" ? "txt" : language);
      const codeLines = [];
      let closed = false;
      while (index + 1 < lines.length) {
        index += 1;
        if (lines[index].startsWith(markdownFence)) {
          closed = true;
          break;
        }
        codeLines.push(lines[index]);
      }
      if (!closed) throw new RequestError(400, "A code block is missing its closing fence.");
      current.blocks ??= [];
      current.blocks.push({
        type: "code",
        language: optionalString(language, 30) || "text",
        label: optionalString(label, 100) || "snippet.txt",
        value: codeLines.join("\n").replace(/\s+$/, ""),
      });
      continue;
    }

    if (line.trim() === ":::evidence") {
      flushParagraph();
      const current = ensureSection();
      const evidence = [];
      let closed = false;
      while (index + 1 < lines.length) {
        index += 1;
        const evidenceLine = lines[index].trim();
        if (evidenceLine === ":::") {
          closed = true;
          break;
        }
        if (!evidenceLine) continue;
        const separator = evidenceLine.indexOf(":");
        if (separator < 1) {
          throw new RequestError(400, "Evidence lines must use “label: value”.");
        }
        evidence.push([
          requireString(evidenceLine.slice(0, separator), "Evidence label", 80),
          requireString(evidenceLine.slice(separator + 1), "Evidence value", 240),
        ]);
      }
      if (!closed) throw new RequestError(400, "An evidence block is missing its closing :::.");
      if (evidence.length) {
        current.blocks ??= [];
        current.blocks.push({ type: "evidence", items: evidence });
      }
      continue;
    }

    if (line.trim() === ":::image") {
      flushParagraph();
      const current = ensureSection();
      const fields = new Map();
      let closed = false;
      while (index + 1 < lines.length) {
        index += 1;
        const imageLine = lines[index].trim();
        if (imageLine === ":::") {
          closed = true;
          break;
        }
        if (!imageLine) continue;
        const separator = imageLine.indexOf(":");
        if (separator < 1) {
          throw new RequestError(400, "Image lines must use \"field: value\".");
        }
        const key = imageLine.slice(0, separator).trim().toLowerCase();
        if (!new Set(["src", "alt", "caption", "width", "height"]).has(key)) {
          throw new RequestError(400, "Unknown image field: " + key + ".");
        }
        if (fields.has(key)) throw new RequestError(400, "Image field \"" + key + "\" appears more than once.");
        fields.set(key, imageLine.slice(separator + 1).trim());
      }
      if (!closed) throw new RequestError(400, "An image block is missing its closing :::.");
      const image = {
        type: "image",
        src: normalizeImageSource(fields.get("src")),
        alt: requireString(fields.get("alt"), "Image alt text", 500),
        caption: optionalString(fields.get("caption"), 500),
        width: normalizeImageDimension(fields.get("width"), "Image width"),
        height: normalizeImageDimension(fields.get("height"), "Image height"),
      };
      current.blocks ??= [];
      current.blocks.push(image);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      const current = ensureSection();
      current.blocks ??= [];
      const lastBlock = current.blocks.at(-1);
      if (lastBlock?.type === "list") {
        lastBlock.items.push(requireString(bullet[1], "List item", 500));
      } else {
        current.blocks.push({
          type: "list",
          items: [requireString(bullet[1], "List item", 500)],
        });
      }
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line.trim());
  }

  flushSection();
  if (!sections.length) {
    throw new RequestError(400, "The post body needs at least one section or paragraph.");
  }
  return sections;
}

function legacyBlocks(section) {
  return [
    ...(section.paragraphs ?? []).map((text) => ({ type: "paragraph", text })),
    ...(section.evidence?.length ? [{ type: "evidence", items: section.evidence }] : []),
    ...(section.bullets?.length ? [{ type: "list", items: section.bullets }] : []),
    ...(section.code ? [{ type: "code", ...section.code }] : []),
  ];
}

export function sectionsToMarkdown(sections) {
  return sections
    .map((section) => {
      const parts = ["## " + section.title];
      for (const block of section.blocks ?? legacyBlocks(section)) {
        if (block.type === "paragraph") parts.push(block.text);
        if (block.type === "evidence") {
          parts.push(
            [":::evidence", ...block.items.map(([label, value]) => label + ": " + value), ":::"]
              .join("\n"),
          );
        }
        if (block.type === "list") parts.push(block.items.map((item) => "- " + item).join("\n"));
        if (block.type === "image") {
          parts.push([
            ":::image",
            "src: " + block.src,
            "alt: " + block.alt,
            ...(block.caption ? ["caption: " + block.caption] : []),
            "width: " + block.width,
            "height: " + block.height,
            ":::"
          ].join("\n"));
        }
        if (block.type === "code") {
          const info = [block.language, block.label].filter(Boolean).join(" ");
          parts.push(markdownFence + info + "\n" + block.value + "\n" + markdownFence);
        }
      }
      return parts.join("\n\n");
    })
    .join("\n\n");
}

function editorPost(post) {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    date: post.date,
    readingTime: post.readingTime,
    tags: post.tags,
    status: post.status,
    isSample: Boolean(post.isSample),
    body: sectionsToMarkdown(post.sections),
  };
}

export function normalizePost(value) {
  const title = requireString(value.title, "Title", 160);
  const slug = slugify(value.slug || title);
  if (!slug) throw new RequestError(400, "The post needs a valid slug.");
  const summary = requireString(value.summary, "Summary", 420);
  const date = requireString(value.date, "Date", 10);
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(date)) {
    throw new RequestError(400, "Date must use YYYY.MM.DD.");
  }
  const [year, month, day] = date.split(".").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new RequestError(400, "Date must be a real calendar date.");
  }
  const status = value.status === "published" ? "published" : "draft";
  const tags = Array.from(
    new Set(
      (Array.isArray(value.tags) ? value.tags : String(value.tags ?? "").split(","))
        .map((tag) => slugify(String(tag).replace(/^#/, "")))
        .filter(Boolean),
    ),
  ).slice(0, 10);
  const body = requireString(value.body, "Body", 250_000);
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title,
    summary,
    date,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)) + " min",
    tags,
    status,
    isSample: Boolean(value.isSample),
    sections: markdownToSections(body),
  };
}

function normalizeLinkUrl(value) {
  const url = optionalString(value, 500);
  if (!url) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new RequestError(400, "Link URLs must use https://, http://, mailto:, or a site-relative path.");
  }
  if (parsed.protocol === "mailto:") {
    const address = parsed.pathname;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      throw new RequestError(400, "Email links must contain a valid address.");
    }
    return "mailto:" + address;
  }
  if (!new Set(["https:", "http:"]).has(parsed.protocol)) {
    throw new RequestError(400, "Links must use a safe https, http, mailto, or site-relative address.");
  }
  return parsed.href;
}

function linkValues(links) {
  if (Array.isArray(links)) return links;
  if (!links || typeof links !== "object") return [];
  return Object.entries(links).map(([key, link]) => ({
    label: link?.label || key.charAt(0).toUpperCase() + key.slice(1),
    url: link?.url || "",
  }));
}

export function normalizeSite(value) {
  const rawLinks = linkValues(value.links);
  if (rawLinks.length > 12) {
    throw new RequestError(400, "The site can show up to 12 social links.");
  }
  const links = rawLinks
    .map((link, index) => {
      const label = optionalString(link?.label, 40);
      const url = normalizeLinkUrl(link?.url);
      if (!label && !url) return null;
      if (!label) throw new RequestError(400, "Link " + (index + 1) + " needs a label.");
      return { label, url };
    })
    .filter(Boolean);
  const aboutParagraphs = (Array.isArray(value.aboutParagraphs)
    ? value.aboutParagraphs
    : String(value.aboutParagraphs ?? "").split(/\n\s*\n/)
  ).map((item) => optionalString(item, 1_500)).filter(Boolean).slice(0, 8);
  const learningTopics = (Array.isArray(value.learningTopics)
    ? value.learningTopics
    : String(value.learningTopics ?? "").split("\n")
  ).map((item) => optionalString(item, 240)).filter(Boolean).slice(0, 12);

  return {
    name: requireString(value.name, "Name", 80),
    role: requireString(value.role, "Role", 140),
    introduction: requireString(value.introduction, "Introduction", 600),
    footerTagline: requireString(value.footerTagline, "Footer tagline", 180),
    aboutLead: requireString(value.aboutLead, "About lead", 700),
    aboutParagraphs,
    learningTopics,
    links,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function backup(filePath, label, targetBackupRoot = backupRoot) {
  await mkdir(targetBackupRoot, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await copyFile(filePath, path.join(targetBackupRoot, label + "-" + timestamp + ".json"));
}

async function writeJson(filePath, label, value, targetBackupRoot = backupRoot) {
  await backup(filePath, label, targetBackupRoot);
  const temporaryPath = filePath + "." + process.pid + "." + randomBytes(6).toString("hex") + ".tmp";
  await writeFile(temporaryPath, JSON.stringify(value, null, 2) + "\n", {
    encoding: "utf8",
    flush: true,
  });
  await rename(temporaryPath, filePath);
}

async function readBody(request, limit = 512_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new RequestError(413, "The request is too large.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "The request body must be valid JSON.");
  }
}

function normalizeImageUpload(value) {
  const postSlug = slugify(value.postSlug);
  if (!postSlug || postSlug !== String(value.postSlug ?? "")) {
    throw new RequestError(400, "Save the post with a valid slug before uploading an image.");
  }
  const mimeType = requireString(value.mimeType, "Image type", 40).toLowerCase();
  const imageType = imageTypes.get(mimeType);
  if (!imageType) throw new RequestError(415, "Use a PNG, JPEG, GIF, or WebP image.");

  const encoded = requireString(value.data, "Image data", Math.ceil(maximumImageBytes * 4 / 3) + 8);
  if (!/^[a-zA-Z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    throw new RequestError(400, "The uploaded image data is invalid.");
  }
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > maximumImageBytes) {
    throw new RequestError(413, "Images must be 8 MB or smaller.");
  }
  if (!imageType.signature(bytes)) {
    throw new RequestError(415, "The file contents do not match the selected image type.");
  }

  const originalName = path.basename(requireString(value.filename, "Image filename", 240));
  const stem = slugify(path.parse(originalName).name) || "image";
  return {
    postSlug,
    stem,
    extension: imageType.extension,
    bytes,
    width: normalizeImageDimension(value.width, "Image width"),
    height: normalizeImageDimension(value.height, "Image height"),
  };
}

async function writeUniqueImage(targetPublicRoot, upload) {
  const directory = path.resolve(targetPublicRoot, "posts", upload.postSlug);
  const relativeDirectory = path.relative(targetPublicRoot, directory);
  if (relativeDirectory.startsWith("..") || path.isAbsolute(relativeDirectory)) {
    throw new RequestError(400, "The image target is outside the public asset directory.");
  }
  await mkdir(directory, { recursive: true });
  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const filename = upload.stem + (suffix === 1 ? "" : "-" + suffix) + upload.extension;
    try {
      await writeFile(path.join(directory, filename), upload.bytes, { flag: "wx" });
      return "/posts/" + upload.postSlug + "/" + filename;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  throw new RequestError(409, "Too many images use that filename. Rename the file and try again.");
}

function sendJson(response, status, value, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(JSON.stringify(value));
}

function sendText(response, status, value, contentType) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(value);
}

export async function startStudio(options = {}) {
  const port = Number(options.port ?? process.env.NOMI_STUDIO_PORT ?? 3030);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("NOMI_STUDIO_PORT must be a port between 1024 and 65535.");
  }

  const configuredPassword = String(options.password ?? process.env.NOMI_STUDIO_PASSWORD ?? "").trim();
  const studioPassword = configuredPassword || randomBytes(12).toString("base64url");
  const activePostsPath = path.resolve(options.postsPath ?? postsPath);
  const activeSitePath = path.resolve(options.sitePath ?? sitePath);
  const activeBackupRoot = path.resolve(options.backupRoot ?? backupRoot);
  const activePublicRoot = path.resolve(options.publicRoot ?? publicRoot);
  const sessionTokens = new Map();
  const allowedHosts = new Set(["127.0.0.1:" + port, "localhost:" + port]);
  const allowedOrigins = new Set(["http://127.0.0.1:" + port, "http://localhost:" + port]);
  let mutationQueue = Promise.resolve();

  const serializeMutation = (operation) => {
    const pending = mutationQueue.then(operation, operation);
    mutationQueue = pending.catch(() => {});
    return pending;
  };

  const isAuthenticated = (request) => {
    const token = parseCookies(request.headers.cookie).nomi_studio_session;
    const expiresAt = token ? sessionTokens.get(token) : undefined;
    if (!token || !expiresAt || expiresAt < Date.now()) {
      if (token) sessionTokens.delete(token);
      return false;
    }
    return true;
  };

  const requireOrigin = (request) => {
    if (!allowedOrigins.has(request.headers.origin)) {
      throw new RequestError(403, "This write request did not come from the local studio.");
    }
  };

  const server = createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );

    try {
      if (!allowedHosts.has(String(request.headers.host ?? "").toLowerCase())) {
        throw new RequestError(403, "Invalid local host.");
      }

      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1:" + port);
      const pathname = requestUrl.pathname;

      if (request.method === "GET" && pathname === "/health") {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === "GET" && pathname === "/") {
        sendText(response, 200, await readFile(path.join(studioRoot, "index.html"), "utf8"), "text/html; charset=utf-8");
        return;
      }

      if (request.method === "GET" && pathname === "/studio.css") {
        sendText(response, 200, await readFile(path.join(studioRoot, "studio.css"), "utf8"), "text/css; charset=utf-8");
        return;
      }

      if (request.method === "GET" && pathname === "/studio.js") {
        sendText(response, 200, await readFile(path.join(studioRoot, "studio.js"), "utf8"), "text/javascript; charset=utf-8");
        return;
      }

      if (request.method === "GET" && pathname === "/state-utils.js") {
        sendText(response, 200, await readFile(path.join(studioRoot, "state-utils.js"), "utf8"), "text/javascript; charset=utf-8");
        return;
      }

      if (request.method === "GET" && pathname === "/fonts/public-sans.woff2") {
        sendText(
          response,
          200,
          await readFile(path.join(projectRoot, "node_modules", "@fontsource-variable", "public-sans", "files", "public-sans-latin-wght-normal.woff2")),
          "font/woff2",
        );
        return;
      }

      if (request.method === "GET" && pathname === "/favicon.svg") {
        sendText(response, 200, await readFile(path.join(projectRoot, "public", "favicon.svg"), "utf8"), "image/svg+xml");
        return;
      }

      if (request.method === "POST" && pathname === "/api/login") {
        requireOrigin(request);
        const body = await readBody(request, 8_000);
        if (!constantTimeEqual(body.password ?? "", studioPassword)) {
          throw new RequestError(401, "That password is not correct.");
        }
        const token = randomBytes(32).toString("base64url");
        sessionTokens.set(token, Date.now() + 8 * 60 * 60 * 1000);
        sendJson(response, 200, { ok: true }, {
          "Set-Cookie": "nomi_studio_session=" + encodeURIComponent(token) + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800",
        });
        return;
      }

      if (request.method === "POST" && pathname === "/api/logout") {
        requireOrigin(request);
        const token = parseCookies(request.headers.cookie).nomi_studio_session;
        if (token) sessionTokens.delete(token);
        sendJson(response, 200, { ok: true }, {
          "Set-Cookie": "nomi_studio_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
        });
        return;
      }

      if (pathname.startsWith("/api/") && !isAuthenticated(request)) {
        throw new RequestError(401, "Unlock the local studio first.");
      }

      if (request.method === "GET" && pathname === "/api/state") {
        const [site, posts] = await Promise.all([readJson(activeSitePath), readJson(activePostsPath)]);
        sendJson(response, 200, {
          site,
          posts: posts
            .map(editorPost)
            .sort((left, right) => right.date.localeCompare(left.date)),
          publicUrl: "http://localhost:3000/",
        });
        return;
      }

      if (request.method === "POST" && pathname === "/api/site") {
        requireOrigin(request);
        const site = normalizeSite(await readBody(request));
        await serializeMutation(() => writeJson(activeSitePath, "site", site, activeBackupRoot));
        sendJson(response, 200, { site });
        return;
      }

      if (request.method === "POST" && pathname === "/api/posts") {
        requireOrigin(request);
        const body = await readBody(request);
        const post = normalizePost(body.post ?? body);
        const originalSlug = slugify(body.originalSlug ?? "");
        let existingIndex = -1;
        await serializeMutation(async () => {
          const posts = await readJson(activePostsPath);
          existingIndex = originalSlug
            ? posts.findIndex((item) => item.slug === originalSlug)
            : -1;
          const collision = posts.some(
            (item, index) => item.slug === post.slug && index !== existingIndex,
          );
          if (collision) throw new RequestError(409, "Another post already uses that slug.");

          if (existingIndex >= 0) posts[existingIndex] = post;
          else posts.push(post);
          posts.sort((left, right) => right.date.localeCompare(left.date));
          await writeJson(activePostsPath, "posts", posts, activeBackupRoot);
        });
        sendJson(response, existingIndex >= 0 ? 200 : 201, { post: editorPost(post) });
        return;
      }

      if (request.method === "POST" && pathname === "/api/images") {
        requireOrigin(request);
        const upload = normalizeImageUpload(await readBody(request, 12_000_000));
        const posts = await readJson(activePostsPath);
        if (!posts.some((post) => post.slug === upload.postSlug)) {
          throw new RequestError(404, "Save the post before uploading its first image.");
        }
        const src = await serializeMutation(() => writeUniqueImage(activePublicRoot, upload));
        sendJson(response, 201, { image: { src, width: upload.width, height: upload.height } });
        return;
      }

      if (request.method === "DELETE" && pathname.startsWith("/api/posts/")) {
        requireOrigin(request);
        const slug = slugify(decodeURIComponent(pathname.slice("/api/posts/".length)));
        await serializeMutation(async () => {
          const posts = await readJson(activePostsPath);
          const nextPosts = posts.filter((item) => item.slug !== slug);
          if (nextPosts.length === posts.length) throw new RequestError(404, "Post not found.");
          await writeJson(activePostsPath, "posts", nextPosts, activeBackupRoot);
        });
        sendJson(response, 200, { ok: true });
        return;
      }

      throw new RequestError(404, "Not found.");
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500;
      const message = error instanceof RequestError ? error.message : "The studio hit an unexpected error.";
      if (status === 500) console.error(error);
      sendJson(response, status, { error: message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  console.log("nomi studio: http://127.0.0.1:" + port + "/");
  if (!configuredPassword) {
    console.log("temporary studio password: " + studioPassword);
    console.log("Set NOMI_STUDIO_PASSWORD in .env.local to keep a stable password.");
  }
  return server;
}

const isDirectRun = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  startStudio().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
