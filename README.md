# nomi portfolio

A dark editorial portfolio for reverse-engineering and malware-analysis learning notes.

## Requirements

- Node.js 22.13 or newer
- npm

## Private authoring studio

Copy `.env.example` to `.env.local` and replace the example password. Then run:

```bash
npm install
npm run author
```

This starts:

- Portfolio preview: http://localhost:3000/
- Private studio: http://127.0.0.1:3030/

If `.env.local` is absent, the terminal prints a temporary password for that session.

The studio binds only to `127.0.0.1`. It is not part of the public portfolio and is not deployed. Content changes are saved to:

- `content/posts.json`
- `content/site.json`

Before any save or deletion, the previous file is copied to `.nomi-studio/backups/`.

### Writing format

The post editor uses a small Markdown subset:

- `## Heading` creates an article section.
- Blank lines separate paragraphs.
- `- item` creates a list.
- Fenced code blocks can include a language and filename.
- Evidence blocks begin with `:::evidence`, contain `label: value` lines, and end with `:::`.

Draft posts stay out of the public site. Change the status to Published and save when a post is ready. Use the per-post “Example or sample write-up” checkbox only for illustrative content; real notes publish without a sample label.

## Other commands

- `npm run dev`: portfolio preview only
- `npm run studio`: private studio only
- `npm run build`: production build
- `npm test`: production build and route tests
- `npm run lint`: lint the project
