# Changelog

## 2026-09-05

- [Feature] Favicon set regenerated in the Kiwi Maru font: full-bleed
  terracotta square (primary hsl(18 55% 42%)) with an optically centered
  cream "K" (Kiwi Maru 500, pixel-verified 0px off-center). Deterministic
  canvas renderer (.tmp/gen-favicon.mjs, 512px master) -> public/
  favicon.ico (16/32/48), favicon.png (32), icons/apple-touch-icon.png
  (180), icons/icon-192.png, icons/icon-512.png. The old DejaVu-font
  favicon.svg is gone (removed from metadata + disk; text-in-SVG
  favicons can't rely on the webfont loading).
- [Feature] Umami analytics embedded (self-hosted tracker): script tag
  in app/layout.tsx head (https://ramen.lostsignals.studio/script.js,
  data-website-id 33d09a69..., data-cache, data-domains=
  kaja.lostsignals.studio so localhost/dev visits are not counted);
  CSP in next.config.mjs whitelists the ramen origin in script-src and
  connect-src (script beacon). Same pattern as Ghosted.
- [Feature] App logo wordmarks ("KAJA") now use the Kiwi Maru font
  (.logo-wordmark utility in globals.css; app header nav + login page),
  uppercase with faux-bold 700 (Kiwi ships no bold face). Rest of the
  app stays on the system stack; landing keeps Kiwi titles only.

## 2026-09-04

- [Feature] Landing page redesign (design direction from a z-ai/glm-5.2
  review via OpenRouter, adapted to Kaja's cream/terracotta palette -
  violet ideas from the review were rejected as off-brand; visual QA via
  the DeepSeek vision API plus deterministic layout probes):
  - Mockups: single-device per breakpoint - desktop browser frame
    (slim URL bar, no traffic lights) on sm+, phone mockup only below
    sm; the mock straddles the terracotta hero band edge. Warm deep
    shadows.
  - Hero: terracotta gradient band (ghosted-style inverted band) with a
    frosted-white pulsing status pill, white benefit-led headline and
    sub copy; the mockup overlaps the band bottom edge.
  - Features: icon chips in terracotta tint + hover lift on cards.
  - CTA band: solid terracotta card with frosted "Coming soon on GitHub"
    pill (was a muddy primary/10 gradient + dashed chip).
  - Copy: "no accounts" claim replaced with "no cloud" (the app does have
    accounts). Focus-visible rings added. axe 0 violations, tsc clean.
- [Feature] Landing copy reworked around the product position (user
  brief 2026-09-04): hero "Not just another food tracker"; features
  reframed as a quiet logbook (snap or type, logbook-not-coach with
  simple counter-actions, no nagging / neurodivergent-friendly,
  self-hosted data, works on mobile + any browser, no subscriptions);
  CTA card now closes with the honest line "The best food tracker? No."
  - keeps the "do one simple job" voice. Feature icons changed
  accordingly (Camera, Sparkles, BellOff, Shield, MonitorSmartphone,
  Wallet).
- [Fix] Hero now has the frosted "Coming soon on GitHub" pill below the
  sub copy (top eyebrow pill removed); both hero and CTA-card pills show
  a small inline GitHub mark. Pills stay non-clickable spans (repo not
  published yet).
- [Feature] Round stamp logo in the hero (replaces the plain icon +
  wordmark lockup). FINAL: the user-authored SVG mark in
  public/kaja-logo.svg ("KAJA" ringed with dots around a crossed-cutlery
  center), rendered via img at h-24/sm:h-28 top-center of the hero.
  Two inline attempts were superseded: a full-circle textPath + lucide
  UtensilsCrossed version, then a GLM-5.2 arc-seal variant - the user
  rejected the GLM one and supplied their own vector.

## 2026-09-02

- [Feature] Public landing page at `/` - the app moves behind /login to
  the logbook at /logbook. Open-source pitch with feature cards, real
  screenshots of the running app (desktop + phone logbook), GitHub CTA.
- [Feature] Landing mockups are now honest screenshots of the actual app
  (real Thai meals + food photos, hot-climate sodium target 2800mg, live
  budget/chart) instead of hand-drawn placeholder UI. Screenshots live in
  `public/landing/`.
- [Fix] Landing copy: no public instance, ever - the product is self-host
  / BYOK only (users bring their own AI key; a host only sets a server
  token for their own instance). GitHub repo is not published yet, so the
  hero and CTA show a single "Coming soon" chip (no live "View/Star it"
  links to a not-yet-public repo).
- [Feature] Footer mirrors Ghosted: "Made with ❤ by Lost Signals Studio"
  + open-source GitHub link.
- [Fix] Landing CTA reads "Coming soon on GitHub" (no public instance,
  ever; the repo is not published yet, so no live View/Star links).
- [Fix] Landing mockups: full-width desktop browser frame with the phone
  mockup tilted in front at the bottom-right (real app screenshots);
  browser chrome shows the kaja domain (kaja.lostsignals.studio).
- Route guard in middleware: anonymous visitors land on the pitch,
  signed-in users go to /logbook. Verified axe 0 violations, no JS errors,
  desktop + mobile layouts.

## 2026-09-01

- [Fix] Service worker removed entirely - SW + App Router streaming RSC
  on iOS Safari is a known bug (blank/stuck pages after navigation) and
  a cache-first SW also served stale shells after every deploy. Ghosted
  (the working reference) has no SW. Manifest stays (installability
  unaffected); offline recording is not valuable for a logbook.
- [Feature] Transparent AI failure reasons instead of a generic 502: the
  app classifies the upstream error into a user-safe explanation (quota
  exhausted, invalid key, rate-limited, timeout, network, empty
  response) and shows it on the record screen; raw errors stay
  server-side only.
- [Feature] Per-user OpenRouter fallback key in Settings > AI (new
  `openrouter_api_key` column, migration 0007): used when Gemini fails
  (quota, outage); the server `OPENROUTER_TOKEN` remains the fallback
  for users without their own key. Same pattern as the existing Gemini
  key - user-set keys preferred.

## 2026-08-31

- [Fix] CI + a11y: GitHub Actions workflow (lint/typecheck/build, unit
  tests, axe audits), Playwright + axe-core added as devDependencies,
  and four real a11y issues the audits caught were fixed: login page
  had no `<main>` landmark (content outside any region), app pages had
  no `h1`, and the dashboard's section headings skipped levels
  (h3 without h2). All routes now audit clean.
- [Fix] Railway build: escaped raw quotes/apostrophes in JSX text and
  cleaned a hooks dependency warning that `next build` treated as errors.

- [Fix] Empty budget card now nudges to log the first meal of the day
  ("Nothing logged yet today - record your first meal...") instead of
  showing only the title.

- [Fix] Security batch (from full-source review): shared-meal writes
  (DELETE/reanalyze) are author-only; participant validation uses
  `inArray` (the old `and(eq...)` was always false for 2+); login rate
  limiter takes the proxy-appended X-Forwarded-For entry; paid AI calls
  are rate-limited (15/hour/user); 502s no longer leak upstream error
  bodies; login `?next=` only accepts relative paths (no open redirect).

- [Fix] Stats responses omit base64 photos (tens of MB for a family
  week) - the detail dialog fetches the photo on demand via a new
  `GET /api/meals/[id]`. Meal visibility now filters in SQL
  (author or participant jsonb containment) instead of in JS.

- [Change] Config users are seeded once per server process instead of
  on every login attempt; the settings PATCH update is typed against
  the schema.

- [Test] Vitest suite (26 tests) for backdate, meal classification,
  BMR/budget math and shared-meal scoping.

## 2026-08-30

- [Feature] Non-food handling: the AI flags items that are not food
  (concrete brick, plastic, electronics, ...) via `isFood` in the response
  schema. Nothing gets stored - the client shows a fun modal (skull icon,
  rotating joke message) with a Dismiss button instead of the result modal.

- [Change] Bistro/coffeeshop theme: warm cream + coffee brown + terracotta
  primary (darkened for contrast), pine green as the "good" color
  (severity bars sage -> pine -> clay, balanced meal tint + ok suggestion
  tone), sage for light meals, clay for trashfood. Icons + favicon
  regenerated in terracotta.
- [Fix] Accessibility: axe-core 4.13 WCAG 2.1 AA - 0 violations on all
  pages in light and dark (progress bars got accessible names,
  muted-foreground and primary contrast fixed).
- [Feature] Fresh meal result is now a bottom-sheet modal (same style as
  the detail view) with Analyze again (when not high confidence) / Save
  meal / Dismiss (removes the just-recorded meal).
- [Change] Navigation: bottom tab bar removed, replaced with a hamburger
  menu in the header (Logbook / Stats / Settings). The record box is
  pinned to the bottom of the viewport on the logbook - everything else
  scrolls under it.


- [Fix] Inverted timezone sign in the day-boundary calculation: meals were
  attributed to the wrong local day for timezones east of UTC (the user is
  in Thailand, UTC+7 - everything recorded before 07:00 UTC looked
  "not counted"). `dayKeyFor` now computes `ts - offset` correctly.
- [Feature] Meal history is grouped with day separators ("Today",
  "Yesterday", weekday) so it is obvious which day each meal belongs to.
- [Feature] Region setting in Settings (Profile): the AI counter-action
  suggestions now name dishes that are commonly available in the user's
  region (e.g. Gai Yang in Thailand) instead of generic advice like
  "more lean protein". Fed into the meal analysis prompt and the
  re-analysis prompt.
- [Fix] Daily sugar target 25g -> 40g: the AI estimates TOTAL sugar
  (fruit, honey, milk included) but 25g is the WHO limit for FREE/ADDED
  sugar only, so normal meals blew past it. Sodium suggestion now triggers
  above 115% of the target instead of 100% (a normal salty meal can sit at
  100-115% of the DV). Cleaned up stale test targets on the demo user
  (sodium 1500 -> 2300).
- [Feature] Climate setting (Settings > Profile): "Hot and humid" raises
  the sodium target by 500mg (heavy sweating increases sodium needs) and
  tells the AI to keep suggestions practical (hydration, electrolytes).
  Salty/sweet meals now get a deterministic hydration tip in the feedback
  ("Salty meal - drink an extra glass of water to help flush the salt").
- [Feature] Deterministic counter-action tips in the budget box: when the
  newest meal makes a big jump in the day's sugar or sodium (>= 30% of the
  daily target), a practical tip appears under the budget (e.g. "Feeling
  jittery after that sugar? Nuts or Greek yogurt..." / "Salty meal - drink
  extra water..."). Decoupled from the AI suggestion, zero model cost, and
  picked from a pool via the meal id so the tip varies between meals.
- [Change] Primary buttons are now pill-shaped (Record, Sign in, Log
  again, Save); secondary/outline buttons stay rounded-xl.
- [Change] Main page order: budget block, how-is-your-day, record block,
  meal history.
- [Feature] shadcn-style theme presets in Settings > Appearance (Emerald
  default, Ocean, Sunset, Violet, Raspberry) - each with light and dark
  variants, persisted per device, applied before hydration.

- [Change] Migrated the UI to the shadcn/ui component system (same stack as
  Ghosted): `components/ui/*` with cva variants, Radix primitives (Dialog,
  Label, Progress, Slot), `clsx` + `tailwind-merge` (`cn` in lib/utils.ts)
  and `tailwindcss-animate` with dialog/sheet keyframes. Server-only
  helpers moved to `lib/server.ts` so client components stay free of
  `next/headers`. All modals (meal detail, delete confirm, password) now
  use the Radix Dialog (focus trap, escape, aria) with the same
  bottom-sheet-on-mobile styling.

## 2026-08-29

- [Feature] Initial build of the Kaja food logbook: text + photo meal
  recording with Gemini nutrition estimates (BYOK), deterministic + AI
  counter-action suggestions, shared meals split equally, re-record from the
  cached meal stack, daily/weekly/monthly dashboards (me + family scopes),
  config-file users with username/password login, settings (API key,
  password, dietary profile, daily targets), installable PWA shell.
- [Feature] Height + current weight settings: computed BMI with category,
  and a recommended daily intake (rough BMR from height/weight, adjusted by
  goals and diet keywords such as weight loss, low sodium, low sugar, low
  carb, high protein) with an "Apply to daily targets" button. BMI and body
  data are also included in the AI context for portion estimates.
- [Feature] Backdating: descriptions containing relative time words
  ("yesterday", "last night", "N days ago", "the day before yesterday",
  "this morning") record the meal on that date instead of today. The time
  phrase is stripped from the text sent to the AI. Record whenever you
  remember - no pressure.
- [Feature] Progress bars color by severity: blue below 70% of target,
  green when close to 100%, red when over.
- [Feature] Meals without a photo show a food icon matched from the
  name/description keywords (pizza, sandwich, soup, salad, pasta, chicken,
  fish, steak, fruits, sweets, dairy, ...) instead of a generic reload icon.
  Clicking a meal card asks for confirmation before re-adding it.
- [Feature] Modern, mobile-first UI: bottom tab navigation on phones,
  pill-style navigation on desktop, larger touch targets, rounded-2xl cards
  with soft shadows, gradient-tinted background, bottom-sheet confirmation,
  cleaner login screen.
- [Feature] Clicking a history meal opens a detail view with the original
  photo, the nutrition datasheet and the recorded feedback/suggestion, and
  Log again + Close buttons (re-record now happens from there).
- [Feature] Light/dark theme switch in Settings (System / Light / Dark).
  Follows the device setting by default, override is remembered per device.
- [Feature] Sign out moved from the header into Settings.
- [Fix] Progress bars: removed conflicting height classes; bars were only
  invisible because they were at 0% on an empty day - an empty day now
  shows a hint instead of silent gray tracks.
- [Feature] "Analyze again" on any estimate that is not high-confidence
  (fresh result card and meal detail view): re-runs the analysis with a
  stronger model (`gemini-3.6-flash`; pro-tier models are quota-blocked on
  the free tier). The meal is updated in place and the model used is shown.
- [Feature] OpenRouter fallback: when Gemini is unavailable (quota exceeded,
  429, outage) and `OPENROUTER_TOKEN` is set, analysis automatically falls
  back to OpenRouter (`openai/gpt-4o-mini` by default) so recording keeps
  working. The model that actually produced the estimate is recorded on the
  meal.
- [Feature] BMR / TDEE calorie budget: Settings now collects age, gender,
  activity baseline (sedentary to extra) and goal (maintain/lose/gain).
  The daily calorie budget is auto-calculated with Mifflin-St Jeor BMR x
  activity multiplier + goal adjustment (-400/+400). A per-day activity
  override on the main screen adjusts it by +/-250 kcal (Usual / +250 /
  -250). A manual calorie goal in Settings disables auto-calculation until
  toggled back. The main screen shows "Today's budget" with an override
  note. The budget feeds the intake percentages and the AI context.
- [Feature] "How is your day" box above the budget: one-tap activity
  override, labeled Lazy / Average / Active (was Usual / +250 / -250).
- [Feature] Scientific view toggle in Settings (default off): off = the
  main screen shows only percentages of the daily budget; on = exact
  numbers (g, kcal, mg) appear.
- [Feature] Meal cards are tinted by severity (light color wash, no solid
  fill): balanced (green), light (blue), heavy (amber), trashfood (red),
  classified from the meal's sugar/sodium/fat/kcal.
- [Feature] Password change moved to a modal (current password + new
  password typed twice, classic pattern).
- [Feature] Toast notifications for settings save success/errors instead
  of inline text.
- [Change] OpenRouter fallback now uses the same Gemini model
  (`google/gemini-3-flash-preview`) via OpenRouter, so behavior matches the
  direct call when the free quota is exhausted. No OpenAI/Anthropic models.
  `deepseek/deepseek-v4-flash-vision-exp` verified working (vision + JSON)
  as an alternative - slower (~25s per call).
- [Fix] Meal severity classification is now context-aware, not just
  numeric: traditional thai kitchen dishes (som tum, pad ka pao, ...) are
  never trashfood, known junk food is matched by name (mcdonalds, chips,
  cola, chocolate cake, ...), health foods (smoothies, protein shakes,
  salads) are judged by numbers only, and the numeric junk signature
  requires high sugar AND high sodium.
- [Fix] Mobile button patterns: action buttons are full-width or 50-50
  pairs (Shared + Record, Close + Log again, Cancel + Change password),
  "How is your day" is a connected full-width button group, dashboard
  filters are full-width segmented groups, settings save is full width.
- [Fix] Meal cards: the percentage now sits above a small "of day" caption
  instead of one inline line.
- [Fix] Meal card titles and subtitles are left-aligned (button elements
  default to centered text), and the small "of day" caption was dropped -
  the bare percentage is self-explanatory.
- [Feature] Icons on the "How is your day" buttons (lazy/average/active).
- [Feature] The budget box only shows the exact kcal number and the
  override note in scientific view; otherwise it is percentages only.
- [Feature] Full-screen blurred loader while the model analyzes a meal.
- [Feature] The "Shared" button is hidden until another family member
  exists.
- [Feature] Dashboard renamed to Stats; the daily view uses the same meal
  cards as the logbook, with a delete button (and confirmation) instead of
  "Analyze again". "Analyze again" now appears only on the fresh result
  card right after recording.
- [Fix] The delete action moved from the card into the detail dialog (with
  an inline confirmation step) and now works on the main view too - the
  same meal card + dialog mechanism in both places.
- [Fix] Budget container: the intake header reads "Calories" and the bare
  percentage is shown (no "of budget" suffix - "Today's budget" is already
  written above).
- [Fix] The Record button uses the fork-and-knife icon from the logo.
- [Fix] The delete action in the detail dialog opens a separate
  confirmation modal again, sits above the Close / Log again pair, and the
  action buttons got icons (trash, x, re-record).

