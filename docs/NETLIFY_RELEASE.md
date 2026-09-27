# SAVE SLOT 02 — Netlify Release Notes

## Existing configuration

`netlify.toml` is already release-oriented:
- Node 22
- npm run build
- dist
- SPA fallback
- X-Robots-Tag noindex/nofollow/noarchive
- Referrer-Policy no-referrer
- X-Content-Type-Options nosniff
- camera/microphone/geolocation disabled
- immutable Vite asset cache

## Do not add
- analytics
- identity/login
- forms
- serverless functions
- environment secrets

unless a real release requirement appears.

## Recommended deploy model

Private GitHub repo → Netlify connected deploy.

Production should use an intentional release/default branch after review.

## Slug

Neutral and non-identifying.

## Verify headers

Use browser/network or curl:
- X-Robots-Tag
- Referrer-Policy
- X-Content-Type-Options
- Permissions-Policy

## Cache warning

HTML should not be given immutable caching.

Only fingerprinted /assets are immutable.

## Source maps

If Vite production source maps are disabled by default, keep them disabled
unless debugging requires them.

Do not expose extra private docs in dist; Vite should only bundle imported
runtime assets/public files.

## docs/

Repository `docs/` is not automatically shipped by Vite.

Verify no reference board is imported accidentally into runtime.

## robots

Keep:
`public/robots.txt`

Expected to disallow crawling in addition to response noindex header.
