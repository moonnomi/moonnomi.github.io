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

Posts are stored in `content/posts.json`, with images under `public/posts/<post-slug>/`. Draft posts stay out of public pages, search results, sitemaps, and generated routes.

The Studio records an internal `publishedAt` timestamp the first time a post is published. It uses that timestamp to order posts created on the same day while the public site continues to show only the date.

Inline code and links use familiar Markdown syntax:

```md
The instruction `jne 0x4011b0` jumps to the failure branch.

[Original crackme](https://example.com/challenge)
```

## Deploy

Push to `main`, enable **GitHub Actions** as the Pages source in the repository settings, and the included workflow will deploy the site at `https://moonnomi.github.io/`.

The authoring Studio remains local and is never included in the public site.
