# Changelog

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

