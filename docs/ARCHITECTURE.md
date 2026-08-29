# Architecture

Kaja is a Next.js 14 (App Router) application with a Postgres database,
deployed as a single container. There is no separate API server - route
handlers under `app/api/` are the API.

## Stack

- Next.js 14.2 (App Router, TypeScript, Tailwind v3)
- Postgres 16 with Drizzle ORM (`lib/db/schema.ts`, migrations in `drizzle/`)
- Custom session auth: signed JWT cookie (`lib/auth/token.ts`, `jose`),
  bcrypt password hashing (`lib/auth/password.ts`)
- Gemini REST API for nutrition estimates (`lib/gemini.ts`) - free tier, BYOK
- TanStack Query for client data fetching, date-fns for dates

## Data model

- `users` - username + password hash, dietary profile (bio, goals, diet),
  daily targets, optional per-user Gemini key.
- `meals` - one logged meal: author, participant ids, text description,
  downscaled photo (base64 data URI), nutrition estimate, and the recorded
  suggestion.

Users come from a simple config (`USERS_JSON` env or `users.config.json`) -
no registration flow. The config is only a seed: after creation, the DB row
is authoritative (Settings edits it).

## Key flows

1. **Record a meal** - `POST /api/meals` (multipart: description, photo,
   participants). The server computes the user's day totals (client-local
   timezone), runs the deterministic rule check, sends both to Gemini, and
   stores the estimate plus the suggestion.
2. **Re-record from the stack** - `POST /api/meals/[id]/repeat` copies the
   stored nutrition - no AI call (the "cache data" from the brief).
3. **Dashboards** - `GET /api/stats` aggregates into client-local days.
   Scope `me`: shared meals are split equally between participants.
   Scope `family`: every meal counts once, in full.

## Design decisions

- **Deterministic + AI suggestions** (`lib/suggestions.ts`): local rules
  (sugar/sodium/fat over target, protein low) produce an instant suggestion;
  Gemini gets the same totals and rule and either confirms it or adds an
  extra suggestion. If Gemini fails, the rule suggestion still stands.
- **Timezone** - all "day" boundaries use the client's local timezone
  (`tzOffsetMinutes` parameter); no server-side date handling.
- **No notifications, no nagging** - the only nudge is a dismissible banner on
  the logbook when nothing is logged by evening.
- **Security** - signed session cookie (httpOnly, SameSite=Lax, 30 days),
  `Cache-Control: no-store` on all `/api/*` responses (cross-user data leak
  guard), rate-limited login, CSP/HSTS security headers, image upload
  validated and size-capped, photos downscaled client-side before upload.
- **PWA** - installable shell only (`public/manifest.webmanifest`,
  `public/sw.js`): static assets are cached, API and navigations always hit
  the network. No offline recording.

## File map

```
app/                    pages + API route handlers
app/(app)/              authenticated shell (nav, providers)
components/             UI: logbook form/stack, dashboard, settings
lib/db/                 drizzle schema + client
lib/auth/               token/session/password/user seeding
lib/gemini.ts           Gemini generateContent client
lib/nutrition.ts        totals + targets math
lib/suggestions.ts      deterministic counter-action rules
lib/stats.ts            daily/weekly/monthly aggregation
scripts/                seed + migrate-on-start
drizzle/                generated SQL migrations
docs/                   this documentation
```
