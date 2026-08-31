# Setup

## Prerequisites

- Node.js 20+
- pnpm
- Docker (local Postgres) - or any Postgres 16 reachable via `DATABASE_URL`

## Local development

```bash
pnpm install
cp .env.example .env
```

`.env`:

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | `openssl rand -base64 32` - signs session cookies |
| `GEMINI_TOKEN` | Gemini API key (BYOK, free tier) |
| `GEMINI_MODEL` | Optional, default `gemini-3-flash-preview` (2.5-flash is deprecated for new keys) |
| `GEMINI_MODEL_BETTER` | Optional, stronger model for the "Analyze again" escalation, default `gemini-3.6-flash` |
| `OPENROUTER_TOKEN` | Optional. When set, meal analysis falls back to OpenRouter automatically if Gemini is unavailable (quota/429, outage) |
| `OPENROUTER_MODEL` | Optional fallback model, default `google/gemini-3-flash-preview` (same model as the direct Gemini call). `deepseek/deepseek-v4-flash-vision-exp` also works (vision + JSON, slower) |
| `APP_URL` | Public origin (used for absolute URLs) |
| `USERS_JSON` | Optional JSON array of `{ username, password }` (deployments) |

### Database

```bash
docker compose up -d          # local Postgres on :5433
pnpm db:migrate               # apply migrations
pnpm db:seed                  # create users from users.config.json (or USERS_JSON)
```

Users: no registration page. `users.config.json` (gitignored; see
`users.config.example.json`) or the `USERS_JSON` env var seeds accounts.
Existing users are never overwritten - profile, targets and password are
managed in Settings after creation.

### Run

```bash
pnpm dev    # http://localhost:3100
```

## Deployment (Railway)

A `railway.json` + `Dockerfile` are included. The container start command
runs `scripts/migrate-on-start.mjs` (advisory-locked) and then the Next.js
server.

Required environment variables in production:

- `DATABASE_URL` (+ `DATABASE_UNPOOLED_URL` if using a PgBouncer-proxied
  Railway Postgres)
- `SESSION_SECRET`
- `GEMINI_TOKEN`
- `NODE_ENV=production`
- `USERS_JSON` - seed family accounts, e.g.
  `[{"username":"dad","password":"..."}]`

After first deploy, change passwords in Settings.

Note: the Dockerfile deliberately pins `pnpm@10.12.1` (via `npm install -g`),
not corepack's pnpm 11. pnpm 11's `verify-deps-before-run` re-runs
`pnpm install` at container startup and fails on unapproved build scripts
in non-TTY, which crash-looped the container on Railway. Do not upgrade
pnpm in the Dockerfile without re-testing the full deploy.

## Tests

```bash
pnpm test         # unit tests (vitest): backdate, meal classification,
                  #   BMR/budget math, shared-meal scoping - no DB needed
pnpm test:e2e     # browser a11y audits (Playwright + axe) on the key
                  #   routes - needs the dev server on :3100 (or CI's
                  #   Postgres + USERS_JSON-seeded demo user)
```

CI (`.github/workflows/ci.yml`) runs three jobs on every push/PR:
lint + typecheck + `next build`, the unit tests, and the axe audits
against a fresh Postgres with a seeded demo user.

## PWA

Installable: `public/manifest.webmanifest`, icons in `public/icons/`,
`public/sw.js` registers in production builds. Service worker caches static
assets only - the logbook always works from the network.
