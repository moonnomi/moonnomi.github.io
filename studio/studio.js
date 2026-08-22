import { restoredEditorState } from "/state-utils.js";

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
    tags: byId("post-tags").value.split(",").map((tag) => tag.trim()).filter(Boolean),
    status: byId("post-status").value,
    isSample: byId("post-is-sample").checked,
    body: byId("post-body").value,
  };
}

function fillSiteForm() {
  const site = studioState.site;
  if (!site) return;
  byId("site-name").value = site.name;
  byId("site-role").value = site.role;
  byId("site-introduction").value = site.introduction;
  byId("site-footer-tagline").value = site.footerTagline;
  byId("site-writing-introduction").value = site.writingIntroduction;
  byId("site-about-lead").value = site.aboutLead;
  byId("site-about-paragraphs").value = site.aboutParagraphs.join("\n\n");
  byId("site-learning-topics").value = site.learningTopics.join("\n");
  for (const key of ["github", "email", "resume"]) {
    byId(key + "-label").value = site.links[key].label;
    byId(key + "-url").value = site.links[key].url;
  }
}

function readSiteForm() {
  const link = (key) => ({
    label: byId(key + "-label").value,
    url: byId(key + "-url").value,
  });
  return {
    name: byId("site-name").value,
    role: byId("site-role").value,
    introduction: byId("site-introduction").value,
    footerTagline: byId("site-footer-tagline").value,
    writingIntroduction: byId("site-writing-introduction").value,
    aboutLead: byId("site-about-lead").value,
    aboutParagraphs: byId("site-about-paragraphs").value
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    learningTopics: byId("site-learning-topics").value
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean),
    links: {
      github: link("github"),
      email: link("email"),
      resume: link("resume"),
    },
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

byId("post-form").addEventListener("input", () => setDirty(true));
byId("site-form").addEventListener("input", () => setDirty(true));

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
    studioState.posts.sort((left, right) => right.date.localeCompare(left.date));
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
