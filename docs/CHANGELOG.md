# Changelog

## 2026-08-30

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

