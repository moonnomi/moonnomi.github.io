# nomi

A static blog for reverse engineering and malware analysis write-ups.

## Local development

```sh
npm install
npm run author
```

The terminal prints the local site, private Studio address, and a temporary Studio password. Set `NOMI_STUDIO_PASSWORD` in `.env.local` if you want the password to stay the same.

## Add a post

Open the private Studio started by `npm run author`, create a draft, and write the post in the Body editor. Use **Add an image** to upload screenshots.

Published posts are stored in `content/posts.json`, with images under `public/posts/<post-slug>/`. Drafts are stored locally in the git-ignored `.nomi-studio/drafts.json`, so draft text is not accidentally pushed to the public repository. Draft posts stay out of public pages, search results, sitemaps, and generated routes.

The Studio records an internal `publishedAt` timestamp the first time a post is published. It uses that timestamp to order posts created on the same day while the public site continues to show only the date.

The Studio deliberately listens only on `127.0.0.1`. It is not a remotely hosted administration panel and never stores a GitHub token. After saving a post as **Published**, use **Publish live** to run the checks, create a narrowly scoped commit, and push it through the Git credentials already configured on the machine. The button requires typing the exact post slug before it can push.

## Author from the command line

The CLI uses the same validation, backup directory, draft store, and image rules as the Studio:

```powershell
npm run post -- list
npm run post -- show example-writeup

npm run post -- save C:\path\to\writeup.md `
  --slug example-writeup `
  --title "Example write-up" `
  --summary "A short description." `
  --tags crackme,binary-ninja

npm run post -- image example-writeup C:\path\to\graph.png `
  --alt "Binary Ninja graph showing the success and failure branches." `
  --after "The relevant comparison is:"

npm run post -- status example-writeup published
```

`show` prints an existing post and its Markdown body, while `show <slug> --body-only` prints only the body. `save` creates a draft unless `--status published` is supplied. When updating an existing slug, title, summary, date, and tags are retained unless their flags are provided again. Image insertion requires descriptive alt text and either a unique exact-line `--after` marker or the explicit `--append` option.

To check the complete live-publishing path without committing or pushing:

```sh
npm run post -- deploy example-writeup --yes --dry-run
```

To publish for real:

```sh
npm run publish:live -- example-writeup --yes
```

Live publishing refuses to continue unless the current branch is `main`, `origin` matches this repository, local and remote `main` are identical, and the only modified files are `content/posts.json` plus images for that post. It never force-pushes and never reads or stores a GitHub token.

Inline code and links use familiar Markdown syntax:

```md
The instruction `jne 0x4011b0` jumps to the failure branch.

[Original crackme](https://example.com/challenge)
```

The authoring Studio remains local and is never included in the public site.
