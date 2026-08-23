import { restoredEditorState } from "/state-utils.js";
import { comparePostRecency } from "/post-order.js";

const byId = (id) => document.getElementById(id);
const studioState = {
  site: null,
  posts: [],
  activePost: null,
  originalSlug: "",
  activeView: "posts",
  publicUrl: "http://localhost:3000/",
  dirty: false,
  isNew: false,
  slugTouched: false,
  savedPostSnapshot: null,
  savedSiteSnapshot: null,
  mutating: false,
};

let toastTimer;

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || "The studio could not complete that request.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function notify(message, kind = "success") {
  const toast = byId("toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.kind = kind;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3600);
}

function showLogin(message = "") {
  byId("login-view").hidden = false;
  byId("studio-view").hidden = true;
  byId("skip-link").href = "#login-title";
  byId("skip-link").textContent = "Skip to sign in";
  byId("login-error").textContent = message;
  window.requestAnimationFrame(() => byId("studio-password").focus());
}

function showStudio() {
  byId("login-view").hidden = true;
  byId("studio-view").hidden = false;
  byId("skip-link").href = "#studio-main";
  byId("skip-link").textContent = "Skip to editor";
}

function setDirty(value) {
  studioState.dirty = value;
}

function restoreSavedState() {
  Object.assign(studioState, restoredEditorState(studioState));
  if (studioState.activeView === "site") fillSiteForm();
  else {
    renderPostList();
    renderPostEditor();
  }
}

function confirmDiscard() {
  if (!studioState.dirty) return true;
  if (!window.confirm("Discard your unsaved changes?")) return false;
  restoreSavedState();
  return true;
}

function handleRequestError(error) {
  if (error.status === 401) {
    showLogin("Your studio session expired. Your unsaved edits are still here; unlock and save again.");
    return;
  }
  notify(error.message, "error");
}

function localDate() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(".");
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = String(reader.result ?? "");
      const separator = result.indexOf(",");
      if (separator < 0) reject(new Error("The selected image could not be read."));
      else resolve(result.slice(separator + 1));
    });
    reader.addEventListener("error", () => reject(new Error("The selected image could not be read.")));
    reader.readAsDataURL(file);
  });
}

async function imageDimensions(file) {
  if (typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Fall back to an image element for browsers with partial format support.
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    const release = () => URL.revokeObjectURL(objectUrl);
    image.addEventListener("load", () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      release();
      resolve(dimensions);
    });
    image.addEventListener("error", () => {
      release();
      reject(new Error("The selected file could not be decoded as a PNG, JPEG, GIF, or WebP image."));
    });
    image.src = objectUrl;
  });
}

function insertImageBlock(image, alt, caption) {
  const editor = byId("post-body");
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const before = editor.value.slice(0, start);
  const after = editor.value.slice(end);
  const prefix = !before || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const suffix = !after || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const lines = [
    ":::image",
    "src: " + image.src,
    "alt: " + alt.replace(/\s+/g, " ").trim(),
    ...(caption ? ["caption: " + caption.replace(/\s+/g, " ").trim()] : []),
    "width: " + image.width,
    "height: " + image.height,
    ":::",
  ];
  const insertion = prefix + lines.join("\n") + suffix;
  editor.value = before + insertion + after;
  const cursor = before.length + insertion.length;
  editor.setSelectionRange(cursor, cursor);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus();
}

function renderPostList() {
  const list = byId("post-list");
  list.replaceChildren();
  byId("post-count").textContent = studioState.posts.length === 1
    ? "1 post"
    : studioState.posts.length + " posts";

  if (!studioState.posts.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = "No posts yet. Start with a new draft.";
    list.append(empty);
    return;
  }

  for (const post of studioState.posts) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "post-list-item";
    if (!studioState.isNew && post.slug === studioState.originalSlug) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "true");
    }

    const title = document.createElement("span");
    title.className = "post-list-title";
    title.textContent = post.title;

    const meta = document.createElement("span");
    meta.className = "post-list-meta";
    const date = document.createElement("span");
    date.textContent = post.date;
    const status = document.createElement("span");
    status.className = "post-status";
    status.dataset.status = post.status;
    status.textContent = post.status === "published" ? "Published" : "Draft";
    meta.append(date, status);
    button.append(title, meta);
    button.addEventListener("click", () => selectPost(post));
    list.append(button);
  }
}

function updatePreviewLink() {
  const preview = byId("preview-post-link");
  const post = studioState.activePost;
  const available = Boolean(post && post.status === "published" && post.slug);
  preview.classList.toggle("is-disabled", !available);
  preview.setAttribute("aria-disabled", String(!available));
  byId("preview-post-hint").hidden = available;
  if (available) {
    preview.href = studioState.publicUrl + "notes/" + encodeURIComponent(post.slug);
    preview.removeAttribute("tabindex");
    preview.removeAttribute("title");
  } else {
    preview.removeAttribute("href");
    preview.tabIndex = -1;
    preview.title = "Publish and save this post before opening its preview.";
  }
}

function renderPostEditor() {
  const post = studioState.activePost;
  byId("post-empty").hidden = Boolean(post);
  byId("post-form").hidden = !post;
  if (!post) return;

  byId("post-editor-title").textContent = studioState.isNew ? "New post" : "Edit post";
  byId("post-reading-time").textContent = post.readingTime
    ? post.readingTime + " read"
    : "Reading time is calculated when you save.";
  byId("post-status").value = post.status;
  byId("post-title").value = post.title;
  byId("post-date").value = post.date;
  byId("post-slug").value = post.slug;
  byId("post-summary").value = post.summary;
  byId("post-tags").value = post.tags.join(", ");
  byId("post-is-sample").checked = Boolean(post.isSample);
  byId("post-body").value = post.body;
  byId("delete-post-button").hidden = studioState.isNew;
  byId("insert-image-button").disabled = studioState.isNew;
  byId("post-image-hint").textContent = studioState.isNew
    ? "Save this draft once before uploading its first image."
    : "Images are stored with this post and inserted at the cursor.";
  updatePreviewLink();
}

function selectPost(post, skipConfirmation = false) {
  if (!skipConfirmation && !confirmDiscard()) return;
  studioState.activePost = structuredClone(post);
  studioState.savedPostSnapshot = structuredClone(post);
  studioState.originalSlug = post.slug;
  studioState.isNew = false;
  studioState.slugTouched = true;
  setDirty(false);
  renderPostList();
  renderPostEditor();
}

function createPost() {
  if (!confirmDiscard()) return;
  studioState.activePost = {
    title: "",
    slug: "",
    summary: "",
    date: localDate(),
    publishedAt: "",
    readingTime: "",
    tags: [],
    status: "draft",
    isSample: false,
    body: [
      "## What I looked at",
      "",
      "Start with the question or artifact you examined.",
      "",
      "## What I found",
      "",
      "Record the observations that support your conclusion.",
      "",
      "## What I learned",
      "",
      "Explain what changed in your understanding.",
    ].join("\n"),
  };
  studioState.originalSlug = "";
  studioState.isNew = true;
  studioState.slugTouched = false;
  studioState.savedPostSnapshot = null;
  setDirty(false);
  renderPostList();
  renderPostEditor();
  window.requestAnimationFrame(() => byId("post-title").focus());
}

function readPostForm() {
  return {
    title: byId("post-title").value,
    slug: byId("post-slug").value,
    summary: byId("post-summary").value,
    date: byId("post-date").value,
    publishedAt: studioState.activePost?.publishedAt ?? "",
    tags: byId("post-tags").value.split(",").map((tag) => tag.trim()).filter(Boolean),
    status: byId("post-status").value,
    isSample: byId("post-is-sample").checked,
    body: byId("post-body").value,
  };
}

function siteLinkValues(links) {
  if (Array.isArray(links)) return links;
  if (!links || typeof links !== "object") return [];
  return Object.entries(links).map(([key, link]) => ({
    label: link?.label || key.charAt(0).toUpperCase() + key.slice(1),
    url: link?.url || "",
  }));
}

function readSiteLinks() {
  return Array.from(document.querySelectorAll(".site-link-row")).map((row) => ({
    label: row.querySelector(".site-link-label").value,
    url: row.querySelector(".site-link-url").value,
  }));
}

function renderSiteLinks(links) {
  const list = byId("site-links");
  list.replaceChildren();
  byId("site-links-empty").hidden = links.length > 0;
  byId("add-site-link").disabled = links.length >= 12;

  links.forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "site-link-row";
    row.dataset.linkIndex = String(index);
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Social link " + (index + 1));

    const heading = document.createElement("div");
    heading.className = "site-link-row-heading";
    const title = document.createElement("strong");
    title.textContent = "Link " + (index + 1);
    const actions = document.createElement("div");
    actions.className = "site-link-row-actions";

    const action = (label, name, disabled = false) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = name === "remove" ? "link-row-action is-remove" : "link-row-action";
      button.dataset.linkAction = name;
      button.textContent = label;
      button.disabled = disabled;
      button.setAttribute("aria-label", label + " social link " + (index + 1));
      return button;
    };

    actions.append(
      action("Up", "up", index === 0),
      action("Down", "down", index === links.length - 1),
      action("Remove", "remove"),
    );
    heading.append(title, actions);

    const fields = document.createElement("div");
    fields.className = "site-link-fields";
    const labelField = document.createElement("label");
    labelField.textContent = "Label";
    const labelInput = document.createElement("input");
    labelInput.className = "site-link-label";
    labelInput.maxLength = 40;
    labelInput.placeholder = "LinkedIn";
    labelInput.value = link.label || "";
    labelField.append(labelInput);

    const urlField = document.createElement("label");
    urlField.textContent = "URL or email address";
    const urlInput = document.createElement("input");
    urlInput.className = "site-link-url";
    urlInput.maxLength = 500;
    urlInput.inputMode = "url";
    urlInput.autocomplete = "url";
    urlInput.placeholder = "https://example.com/profile";
    urlInput.value = link.url || "";
    urlField.append(urlInput);

    fields.append(labelField, urlField);
    row.append(heading, fields);
    list.append(row);
  });
}

function fillSiteForm() {
  const site = studioState.site;
  if (!site) return;
  byId("site-name").value = site.name;
  byId("site-role").value = site.role;
  byId("site-introduction").value = site.introduction;
  byId("site-footer-tagline").value = site.footerTagline;
  byId("site-about-lead").value = site.aboutLead;
  byId("site-about-paragraphs").value = site.aboutParagraphs.join("\n\n");
  byId("site-learning-topics").value = site.learningTopics.join("\n");
  renderSiteLinks(siteLinkValues(site.links));
}

function readSiteForm() {
  return {
    name: byId("site-name").value,
    role: byId("site-role").value,
    introduction: byId("site-introduction").value,
    footerTagline: byId("site-footer-tagline").value,
    aboutLead: byId("site-about-lead").value,
    aboutParagraphs: byId("site-about-paragraphs").value
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    learningTopics: byId("site-learning-topics").value
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean),
    links: readSiteLinks(),
  };
}

function switchView(view) {
  if (view === studioState.activeView) return;
  if (!confirmDiscard()) return;
  studioState.activeView = view;
  setDirty(false);
  byId("posts-view").hidden = view !== "posts";
  byId("site-view").hidden = view !== "site";
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

async function loadState() {
  const payload = await api("/api/state");
  studioState.site = payload.site;
  studioState.savedSiteSnapshot = structuredClone(payload.site);
  studioState.posts = payload.posts;
  studioState.publicUrl = payload.publicUrl;
  byId("public-site-link").href = payload.publicUrl;
  fillSiteForm();
  showStudio();
  renderPostList();
  if (studioState.posts.length) selectPost(studioState.posts[0], true);
  else renderPostEditor();
}

byId("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector("button");
  submitButton.disabled = true;
  byId("login-error").textContent = "";
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: byId("studio-password").value }),
    });
    byId("studio-password").value = "";
    if (studioState.site) {
      showStudio();
      notify("Studio unlocked. Your unsaved edits are still here.");
    } else {
      await loadState();
    }
  } catch (error) {
    showLogin(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

byId("logout-button").addEventListener("click", async () => {
  if (!confirmDiscard()) return;
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
  } finally {
    studioState.activePost = null;
    setDirty(false);
    showLogin();
  }
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

byId("new-post-button").addEventListener("click", createPost);

byId("post-title").addEventListener("input", () => {
  if (studioState.isNew && !studioState.slugTouched) {
    byId("post-slug").value = slugify(byId("post-title").value);
  }
});

byId("post-slug").addEventListener("input", () => {
  studioState.slugTouched = true;
});

byId("post-form").addEventListener("input", (event) => {
  if (!event.target.closest(".image-insert")) setDirty(true);
});
byId("site-form").addEventListener("input", () => setDirty(true));

byId("add-site-link").addEventListener("click", () => {
  const links = readSiteLinks();
  if (links.length >= 12) {
    notify("The site can show up to 12 social links.", "error");
    return;
  }
  links.push({ label: "", url: "" });
  renderSiteLinks(links);
  setDirty(true);
  window.requestAnimationFrame(() => {
    document.querySelector(`.site-link-row[data-link-index="${links.length - 1}"] .site-link-label`)?.focus();
  });
});

byId("site-links").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-link-action]");
  if (!button) return;
  const row = button.closest(".site-link-row");
  const index = Number(row?.dataset.linkIndex);
  const links = readSiteLinks();
  if (!Number.isInteger(index) || !links[index]) return;

  let focusIndex = index;
  if (button.dataset.linkAction === "remove") {
    links.splice(index, 1);
    focusIndex = Math.min(index, links.length - 1);
  } else {
    const offset = button.dataset.linkAction === "up" ? -1 : 1;
    const targetIndex = index + offset;
    if (!links[targetIndex]) return;
    [links[index], links[targetIndex]] = [links[targetIndex], links[index]];
    focusIndex = targetIndex;
  }

  renderSiteLinks(links);
  setDirty(true);
  window.requestAnimationFrame(() => {
    if (focusIndex < 0) byId("add-site-link").focus();
    else document.querySelector(`.site-link-row[data-link-index="${focusIndex}"] .site-link-label`)?.focus();
  });
});

byId("insert-image-button").addEventListener("click", async () => {
  if (studioState.isNew || studioState.mutating) return;
  const file = byId("post-image-file").files[0];
  const alt = byId("post-image-alt").value.trim();
  const caption = byId("post-image-caption").value.trim();
  if (!file) {
    notify("Choose an image file first.", "error");
    return;
  }
  if (!alt) {
    notify("Add alt text that describes what the image shows.", "error");
    byId("post-image-alt").focus();
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    notify("Images must be 8 MB or smaller.", "error");
    return;
  }

  studioState.mutating = true;
  const button = byId("insert-image-button");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = "Uploading...";
  try {
    const [data, dimensions] = await Promise.all([fileAsBase64(file), imageDimensions(file)]);
    const payload = await api("/api/images", {
      method: "POST",
      body: JSON.stringify({
        postSlug: studioState.originalSlug,
        filename: file.name,
        mimeType: file.type,
        data,
        ...dimensions,
      }),
    });
    insertImageBlock(payload.image, alt, caption);
    byId("post-image-file").value = "";
    byId("post-image-alt").value = "";
    byId("post-image-caption").value = "";
    byId("insert-image-button").closest("details").open = false;
    notify("Image inserted. Save the post when you are ready.");
  } catch (error) {
    handleRequestError(error);
  } finally {
    studioState.mutating = false;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = "Upload and insert";
  }
});

byId("post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (studioState.mutating) return;
  studioState.mutating = true;
  const saveButton = byId("save-post-button");
  saveButton.disabled = true;
  saveButton.setAttribute("aria-busy", "true");
  saveButton.textContent = "Saving…";
  try {
    const payload = await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        originalSlug: studioState.originalSlug,
        post: readPostForm(),
      }),
    });
    const saved = payload.post;
    const index = studioState.posts.findIndex((post) => post.slug === studioState.originalSlug);
    if (index >= 0) studioState.posts[index] = saved;
    else studioState.posts.unshift(saved);
    studioState.posts.sort(comparePostRecency);
    studioState.activePost = structuredClone(saved);
    studioState.savedPostSnapshot = structuredClone(saved);
    studioState.originalSlug = saved.slug;
    studioState.isNew = false;
    studioState.slugTouched = true;
    setDirty(false);
    renderPostList();
    renderPostEditor();
    notify(saved.status === "published" ? "Post published and preview updated." : "Draft saved.");
  } catch (error) {
    handleRequestError(error);
  } finally {
    studioState.mutating = false;
    saveButton.disabled = false;
    saveButton.removeAttribute("aria-busy");
    saveButton.textContent = "Save post";
  }
});

byId("delete-post-button").addEventListener("click", async () => {
  const post = studioState.activePost;
  if (!post || studioState.isNew || studioState.mutating) return;
  if (!window.confirm("Delete “" + post.title + "”? A local backup will be kept.")) return;
  studioState.mutating = true;
  byId("delete-post-button").disabled = true;
  try {
    await api("/api/posts/" + encodeURIComponent(studioState.originalSlug), {
      method: "DELETE",
      body: "{}",
    });
    studioState.posts = studioState.posts.filter((item) => item.slug !== studioState.originalSlug);
    studioState.activePost = null;
    studioState.savedPostSnapshot = null;
    studioState.originalSlug = "";
    setDirty(false);
    renderPostList();
    if (studioState.posts.length) selectPost(studioState.posts[0], true);
    else renderPostEditor();
    notify("Post deleted. A local backup was kept.");
  } catch (error) {
    handleRequestError(error);
  } finally {
    studioState.mutating = false;
    byId("delete-post-button").disabled = false;
  }
});

byId("site-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (studioState.mutating) return;
  studioState.mutating = true;
  const saveButton = event.currentTarget.querySelector(".primary-action");
  saveButton.disabled = true;
  saveButton.setAttribute("aria-busy", "true");
  saveButton.textContent = "Saving…";
  try {
    const payload = await api("/api/site", {
      method: "POST",
      body: JSON.stringify(readSiteForm()),
    });
    studioState.site = payload.site;
    studioState.savedSiteSnapshot = structuredClone(payload.site);
    fillSiteForm();
    setDirty(false);
    notify("Site details saved and preview updated.");
  } catch (error) {
    handleRequestError(error);
  } finally {
    studioState.mutating = false;
    saveButton.disabled = false;
    saveButton.removeAttribute("aria-busy");
    saveButton.textContent = "Save site details";
  }
});

document.addEventListener("keydown", (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
  if (byId("studio-view").hidden) return;
  event.preventDefault();
  if (studioState.mutating) return;
  if (studioState.activeView === "posts" && !byId("post-form").hidden) {
    byId("post-form").requestSubmit();
  } else if (studioState.activeView === "site") {
    byId("site-form").requestSubmit();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!studioState.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

loadState().catch((error) => {
  if (error.status === 401) showLogin();
  else showLogin("Could not reach the local studio backend.");
});
