---
version: 1
slug: "studio-index-html"
primary_target: "studio/index.html"
related_targets: ["scripts/studio.mjs","scripts/author.mjs","content/posts.json","content/site.json"]
---

## Scope and mode

- Surface: private local authoring studio served from `studio/index.html` by `scripts/studio.mjs`.
- Visitor mode: Operate.
- This is a local extension of the established Night Reading Room world, not a new identity.

## Audience, job, and task

- Audience: nomi only, working on the same computer as the repository.
- Job: create, edit, draft, publish, and remove write-ups; update the portfolio's recurring profile copy and contact links.
- Primary task: select or create a post, edit familiar fields and Markdown, save with one clear action, then open the public preview.

## Content and constraints

- Posts remain versionable repository JSON, not browser storage.
- Drafts never appear on the public portfolio.
- The server binds only to `127.0.0.1`, requires a password, rejects cross-origin writes, and makes a backup before content changes.
- Image uploads, collaborative editing, analytics, and public account management are outside the current scope.
- Keyboard save, explicit success/error feedback, empty states, destructive confirmation, and mobile stacking are required.

## Direction

- Structure: a compact onyx workbench with a narrow post index and one platinum editor surface; Site settings replaces the editor without adding dashboard metrics.
- First view: identity and two task labels at the top, post list on the left, active document fields on the right, Save and public preview in the persistent action row.
- Memorable moment: switching posts changes the paper editor in place; the interface disappears into writing.
- Refusals: no analytics cards, charts, terminal chrome, status telemetry, fake activity, or decorative animation.

## Unresolved

- Rich media and file uploads can be added later if real post content needs them.
