# API

Base: same origin, JSON unless noted. All endpoints except login require the
session cookie. Every `/api/*` response is `Cache-Control: no-store`.

Dates: day boundaries use the client's local timezone, sent as
`tzOffsetMinutes` (`new Date().getTimezoneOffset()`).

## Auth

### `POST /api/auth/login`
Body: `{ "username": string, "password": string }`
Sets the session cookie. Rate limited (8 attempts / 15 min per IP).

### `POST /api/auth/logout`
Clears the session cookie.

### `GET /api/auth/me`
Returns `{ user }` - public user shape: `id, username, bio, goals, diet,
targetKcal, targetProteinG, targetFatG, targetCarbsG, targetSugarG,
targetSodiumMg, hasOwnApiKey`.

## Users

### `GET /api/users`
Returns `{ users: [{ id, username }] }` - the family list, used for the
"shared with" picker. Auth required.

## Meals

### `GET /api/meals?limit=40`
Returns `{ meals: MealDto[] }` - meals the user can see (authored or shared
with them), newest first. `MealDto` = `{ id, authorId, participantIds,
description, imageData, mealName, portion, confidence, source, nutrition,
suggestion, createdAt }` where `nutrition = { kcal, proteinG, fatG, carbsG,
sugarG, sodiumMg }`.

### `POST /api/meals`
Multipart form: `description` (text, optional if photo), `imageData` (base64
data URI, optional), `participantIds` (JSON array of user ids, optional),
`tzOffsetMinutes`. Analyzes with Gemini (the user's key override, else
`GEMINI_TOKEN`), stores the meal, returns
`{ meal, totals, suggestion }` where `totals` is the user's fresh day totals.

If the AI decides the item is NOT food (brick, plastic, electronics, ...),
nothing is stored and it returns `{ notFood: true, mealName, description }`
so the client can show the fun "not food" modal instead of the result modal.

Relative time words in the description backdate the meal:
"yesterday", "last night", "N days ago", "the day before yesterday",
"this morning". The phrase is removed from the text sent to the AI.

Errors: 400 (invalid input), 503 (no Gemini key configured), 502 (analysis
failed).

### `DELETE /api/meals/[id]`
Deletes a meal the user can see (authored or shared with them). Returns
`{ ok: true }`.

### `POST /api/meals/[id]/reanalyze`
Re-runs the estimate with the stronger Gemini model
(`GEMINI_MODEL_BETTER`, default `gemini-3.6-flash`) and updates the meal in
place. Returns `{ meal, dayTotals, model }` where `dayTotals` covers the
meal's own day (it may be backdated).

### `POST /api/meals/[id]/repeat`
Re-records a previous meal from stored data - no AI call. Returns
`{ meal, totals }`.

## Stats

### `GET /api/stats?range=daily|weekly|monthly&scope=me|family&date=YYYY-MM-DD&tzOffsetMinutes=`
Returns `{ range, scope, date, targets, budget, days, summary }`.
`targets.kcal` is the effective budget for the anchor day (BMR/TDEE or
manual override). `budget = { kcal, overrideMode, manual, complete }`.
`days` is one (daily), 7 (weekly) or 30 (monthly) day entries, each with
`date, totals, meals`. `summary` holds `totalKcal, avgKcal, mealCount,
totalProteinG, totalFatG, totalCarbsG, totalSugarG, totalSodiumMg`.

Scope `me`: shared meals count as `1 / participantCount` for the viewer.
Scope `family`: every meal counts once, in full.

## Settings

### `GET /api/settings`
Returns `{ user }` (same shape as `/api/auth/me`).

### `PATCH /api/settings`
Body: any of `bio, goals, diet, region, heightCm, weightKg, age, gender,
activity, goal, manualKcal, targetProteinG, targetFatG, targetCarbsG,
targetSugarG, targetSodiumMg, geminiApiKey, password, username`.
`password` and `username` changes require `currentPassword` in the same
body; `username` must not be taken by another user.
`password` requires `currentPassword` in the same body. Empty
`geminiApiKey` clears the user override (falls back to `GEMINI_TOKEN`).
`heightCm`/`weightKg`/`age`/`gender` may be null to clear. `manualKcal`
(null = automatic BMR/TDEE budget, any value = manual override).

### `POST /api/override?tzOffsetMinutes=`
Body: `{ "mode": "usual" | "more" | "less" }`. Sets today's activity
override (more/less active adjusts the budget by +/-250 kcal). Returns
`{ mode, budget }`.
