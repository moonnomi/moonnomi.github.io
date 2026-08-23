# nomi portfolio

A dark editorial portfolio for beginner reverse-engineering and malware-analysis posts.

The public site and the private authoring studio live in the same repository, but they are separate applications:

- The public portfolio displays published posts.
- The studio runs only on the local computer and edits the content files.
- Content is stored in JSON files, not in a database.
- Git tracks every content and code change that is committed.

## Storage: no database

Posts are stored in [`content/posts.json`](content/posts.json). Recurring profile, About-page, and contact content is stored in [`content/site.json`](content/site.json).

There is currently no SQLite, D1, PostgreSQL, or other database behind the portfolio. The `d1` and `r2` entries in [`.openai/hosting.json`](.openai/hosting.json) are both `null`, and the public application does not run any database queries. Some database packages remain from the original project starter, but they are not used by the portfolio.

The content flow is:

```text
Local studio form
    -> local Node.js studio server
    -> validation and Markdown parsing
    -> automatic JSON backup
    -> content/posts.json or content/site.json
    -> app/content.ts imports the JSON
    -> published posts are rendered by the portfolio
```

This is a good fit for a small personal portfolio because the content changes only when its owner edits and redeploys the repository. A database would become useful only if the site later needed an online CMS, multiple authors, accounts, comments, or content that changes without a new deployment.

## Requirements

- Node.js 22.13 or newer
- npm
- Git

## Local setup

Install the dependencies:

```powershell
npm install
```

Create a local studio password file:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and replace the example value:

```dotenv
NOMI_STUDIO_PASSWORD=replace-with-a-long-local-password
```

The `.env.local` file is ignored by Git and must never be committed.

Start the portfolio and studio together:

```powershell
npm run author
```

This starts:

- Portfolio preview: <http://localhost:3000/>
- Private studio: <http://127.0.0.1:3030/>

If `.env.local` does not exist, the terminal prints a temporary password. That password changes when the studio restarts.

## How the private studio works

The studio is implemented by [`studio/`](studio/) and [`scripts/studio.mjs`](scripts/studio.mjs). It is intentionally local-only:

- It listens on `127.0.0.1`, not the public network.
- It accepts only local host and local origin requests.
- Its login session is stored in memory and lasts up to eight hours.
- Its authentication cookie is HTTP-only and SameSite Strict.
- Restarting the studio clears all login sessions.
- It is not included as an online admin dashboard when the portfolio is deployed.

When a post or site setting is saved, the studio:

1. Validates the submitted fields.
2. Converts the editor's Markdown subset into structured post blocks.
3. Copies the previous JSON file into `.nomi-studio/backups/`.
4. Writes a temporary file and then renames it over the content file.
5. Serializes overlapping saves so two writes cannot corrupt the file.

The backup directory and local environment files are ignored by Git.

## Post structure

Each object in `content/posts.json` contains:

```json
{
  "slug": "example-post",
  "title": "Example post",
  "summary": "A short description shown in post lists.",
  "date": "2026.08.23",
  "readingTime": "4 min",
  "tags": ["static-analysis"],
  "status": "draft",
  "isSample": false,
  "sections": []
}
```

Important behavior:

- Dates use `YYYY.MM.DD` and must be real calendar dates.
- Slugs become the URL: `/notes/example-post`.
- Reading time is calculated automatically at roughly 200 words per minute.
- Posts are sorted newest-first by date.
- Only posts with `"status": "published"` enter the public site.
- The newest published post becomes the featured homepage post.
- Remaining published posts appear under **Latest posts**.
- The `isSample` flag adds the visible sample label. Real posts should normally set it to `false`.

The filtering and sorting happen in [`app/content.ts`](app/content.ts). The public pages then use that prepared list:

- [`app/page.tsx`](app/page.tsx): homepage and featured post
- [`app/notes/page.tsx`](app/notes/page.tsx): complete Posts archive
- [`app/notes/[slug]/page.tsx`](app/notes/[slug]/page.tsx): individual article pages
- [`app/site-frame.tsx`](app/site-frame.tsx): navigation and in-memory search

Search does not use a service or database. The browser filters the published post titles, summaries, and tags already supplied with the page.

## Editor writing format

The studio editor accepts a deliberately small Markdown subset:

### Sections

```markdown
## Initial triage
```

Every level-two heading creates an article section and table-of-contents entry. Text before the first heading is placed in a generated `Notes` section.

### Paragraphs

Separate paragraphs with a blank line.

### Lists

```markdown
- First observation
- Second observation
```

### Code blocks

Use a fenced block. The first value is the language and the remaining text becomes its visible filename or label.

````markdown
```python decoder.py
def decode(value):
    return value ^ 0x41
```
````

### Evidence blocks

```markdown
:::evidence
SHA-256: placeholder
Architecture: x86-64
Packer clue: unusually small import table
:::
```

Each evidence line must use `label: value`.

## Publishing a first real post

1. Run `npm run author`.
2. Open the local studio and create a post.
3. Start with the status set to **Draft**.
4. Fill in the title, slug, summary, date, tags, and body.
5. Leave **Example or sample write-up** unchecked.
6. Save the draft while writing. Drafts do not appear on the portfolio.
7. When ready to preview, change the status to **Published** and save. This publishes only to the local preview until the repository is pushed and deployed.
8. Open the preview and review the homepage, Posts archive, article, code blocks, and mobile layout.
9. Delete the current sample posts or change them back to drafts before the public launch.
10. Update the placeholder profile links in **Site details**.
11. Run the checks below.
12. Commit the content files and push them to GitHub.

Recommended checks:

```powershell
npm test
npm run lint
```

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run author` | Start the portfolio preview and private studio together |
| `npm run dev` | Start only the portfolio development server |
| `npm run studio` | Start only the private studio |
| `npm run build` | Create the current production build |
| `npm run start` | Run the current production build locally |
| `npm test` | Build the site and run the automated tests |
| `npm run lint` | Check the project source with ESLint |

## Main project directories

| Path | Purpose |
| --- | --- |
| `app/` | Public portfolio routes, components, styles, and content loader |
| `content/` | Git-tracked JSON content for posts and site details |
| `studio/` | Local authoring interface |
| `scripts/` | Local studio server and combined authoring command |
| `public/` | Public favicon and static assets |
| `tests/` | Rendering, content, and studio safety tests |
| `worker/` | Current Vinext/Cloudflare Worker entry point |
| `build/` | Build integration inherited from the site starter |
| `.nomi-studio/backups/` | Ignored automatic local backups created before writes |

## GitHub Pages deployment status

The repository is not yet configured for GitHub Pages. Do not upload the current `dist/client` directory by itself and expect the site to work.

The current `npm run build` is configured for a Vinext application with a Cloudflare Worker runtime. It produces browser assets in `dist/client` and server code in `dist/server`. GitHub Pages serves static files only, so it cannot run `dist/server/index.js`, the Worker, or the local authoring studio.

The public portfolio is still a good candidate for GitHub Pages because:

- All public content comes from local JSON at build time.
- Draft filtering and post ordering happen during the build.
- Every article slug is known through `generateStaticParams()`.
- There are no public database calls or server-side submissions.
- Vinext supports `output: "export"` for generating static HTML.

Before deploying, the project needs a dedicated GitHub Pages pass:

1. Add a `next.config.ts` that enables `output: "export"` and usually `trailingSlash: true`.
2. Build and verify that `dist/client` contains an `index.html`, a Posts archive HTML file, and one HTML file for every published slug.
3. Configure the correct base path if this is a project site.
4. Add a GitHub Actions workflow that installs Node.js 22, runs `npm ci`, builds the export, uploads `dist/client`, and deploys it with GitHub Pages.
5. In the repository's **Settings -> Pages**, choose **GitHub Actions** as the source.

The easiest URL arrangement is a repository named exactly:

```text
YOUR_USERNAME.github.io
```

That publishes at the domain root and avoids a repository subpath. A repository named `portfolio` publishes at `YOUR_USERNAME.github.io/portfolio/`, which requires matching base-path and asset-prefix configuration.

After the Pages workflow exists, the normal update cycle will be:

```text
Write locally -> save JSON -> test -> commit -> push -> GitHub Actions rebuilds the static site
```

The studio will remain local. GitHub Pages cannot provide an online editor that writes back to these JSON files. Adding that later would require a hosted backend, authentication, and persistent storage.

Official references:

- [GitHub Pages: using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages: configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Vinext documentation and static-export support](https://github.com/cloudflare/vinext)

## Security notes

- Never commit `.env.local`, passwords, tokens, private reports, or personal data.
- Treat everything inside `content/` and `public/` as public once the repository is pushed.
- Do not place live malware samples, credentials, victim data, or dangerous binaries in the repository or Pages site.
- Prefer hashes, screenshots, redacted excerpts, pseudocode, and safe reproduction notes in public write-ups.
