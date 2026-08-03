# Hosting the community on Cloudflare Pages

Cloudflare Pages builds this repo straight from GitHub and serves the result — no build
artifacts are committed, and no GitHub Actions workflow is involved.

## One-time setup

**Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**

| Setting | Value |
| --- | --- |
| Repository | `Eric-Tomchik/charity-swipes-community` |
| Production branch | `main` |
| Framework preset | None / Vite |
| Build command | `bun run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |

**Environment variables** (Settings → Environment variables, add to *both* Production and Preview):

| Name | Value |
| --- | --- |
| `VITE_CONVEX_URL` | `https://trustworthy-octopus-88.convex.cloud` |

Cloudflare's build image includes Bun and picks it up from `bun.lock`. If a build ever fails on
the package manager, set `SKIP_DEPENDENCY_INSTALL=1` and make the build command
`bun install --frozen-lockfile && bun run build`.

## Custom domain

**Pages project → Custom domains → Set up a domain → `community.erictomchik.com`**

Because `erictomchik.com` is on the same Cloudflare account, Cloudflare creates the DNS record
and issues the certificate itself — nothing to add by hand.

## Client-side routing

This project deploys as a **Worker with static assets** (`npx wrangler deploy`), not as Pages,
so SPA fallback comes from `wrangler.jsonc`:

```jsonc
"assets": { "directory": "./dist", "not_found_handling": "single-page-application" }
```

That serves the SPA shell for deep links such as `/admin` and `/channel/general` instead of
returning 404. Static assets still win, so `/assets/*` is unaffected.

Do **not** add a Pages-style `public/_redirects` with `/*  /index.html  200`: Workers validates
`_redirects` too and rejects that rule with `Invalid _redirects configuration: Infinite loop
detected in this rule` (code 100324), which fails the deploy.

## Private repositories

This works with a private repo — Cloudflare Pages authenticates through the GitHub app, unlike
GitHub Pages which requires a paid plan for private sources.

## Marketing site

`marketing-site/index.html` is a separate, self-contained page (currently served from IONOS at
charityswipes.org). It can be hosted the same way with a second Pages project whose build output
directory is `marketing-site` and whose build command is empty.
