# Kaja

kaja [noun] | /ˈkɒ.jɒ/ (plural kaják)

(Hungarian slang) Food, grub, chow; any edible substance consumed for nourishment or pleasure.

A simple food logbook with AI-assisted nutrition estimates. Free Gemini
(BYOK) turns a vague text description or a photo into a best-effort estimate
of calories, fat, protein, carbs, sugar and sodium. Self-hosted for a family -
no sign-ups, no notifications, no nagging.

## Quick start

```bash
pnpm install
cp .env.example .env            # fill DATABASE_URL, SESSION_SECRET, GEMINI_TOKEN
docker compose up -d            # local Postgres
pnpm db:migrate                 # apply schema
pnpm db:seed                    # create users from users.config.json
pnpm dev                        # http://localhost:3100
```

See [docs/INDEX.md](docs/INDEX.md) for the full documentation.
