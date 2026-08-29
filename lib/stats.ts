import type { Meal } from "@/lib/db/schema";
import type { Targets, Totals } from "./nutrition";
import { addMeal, emptyTotals, mealScaleForUser } from "./nutrition";
import type { DayEntry, MealDto, StatsResponse } from "./types";

export type Range = "daily" | "weekly" | "monthly";
export type Scope = "me" | "family";

const MS_DAY = 86_400_000;

/**
 * Date key (YYYY-MM-DD) of a timestamp in the CLIENT's local time.
 * The client sends its UTC offset in minutes (Date.getTimezoneOffset()).
 */
export function dayKeyFor(ts: number, tzOffsetMin: number): string {
  const d = new Date(ts + tzOffsetMin * 60_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function rangeKeys(anchorKey: string, range: Range): string[] {
  const [y, m, d] = anchorKey.split("-").map(Number);
  const anchor = Date.UTC(y, m - 1, d);
  const count = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(dayKeyFor(anchor - i * MS_DAY, 0));
  }
  return keys;
}

export function mealToDto(meal: Meal): MealDto {
  return {
    id: meal.id,
    authorId: meal.authorId,
    participantIds: meal.participantIds ?? [],
    description: meal.description,
    imageData: meal.imageData,
    mealName: meal.mealName,
    portion: meal.portion,
    confidence: meal.confidence,
    source: meal.source,
    nutrition: {
      kcal: meal.kcal,
      proteinG: meal.proteinG,
      fatG: meal.fatG,
      carbsG: meal.carbsG,
      sugarG: meal.sugarG,
      sodiumMg: meal.sodiumMg,
    },
    suggestion: meal.suggestion,
    createdAt: meal.createdAt.toISOString(),
  };
}

export function computeStats(
  meals: Meal[],
  userId: string | null, // null = family scope (every meal counts once)
  scope: Scope,
  range: Range,
  anchorKey: string,
  tzOffsetMin: number,
  targets: Targets
): StatsResponse {
  const keys = rangeKeys(anchorKey, range);
  const keySet = new Set(keys);
  const byDay = new Map<string, Meal[]>();
  for (const meal of meals) {
    const k = dayKeyFor(meal.createdAt.getTime(), tzOffsetMin);
    if (!keySet.has(k)) continue;
    const arr = byDay.get(k) ?? [];
    arr.push(meal);
    byDay.set(k, arr);
  }

  const days: DayEntry[] = keys.map((key) => {
    const list = (byDay.get(key) ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const totals: Totals = emptyTotals();
    for (const meal of list) addMeal(totals, meal, mealScaleForUser(meal, userId));
    return { date: key, totals, meals: list.map(mealToDto) };
  });

  let daysWithMeals = 0;
  const summary = {
    totalKcal: 0,
    avgKcal: 0,
    mealCount: 0,
    totalProteinG: 0,
    totalFatG: 0,
    totalCarbsG: 0,
    totalSugarG: 0,
    totalSodiumMg: 0,
  };
  for (const day of days) {
    if (day.totals.meals > 0) daysWithMeals++;
    summary.totalKcal += day.totals.kcal;
    summary.totalProteinG += day.totals.proteinG;
    summary.totalFatG += day.totals.fatG;
    summary.totalCarbsG += day.totals.carbsG;
    summary.totalSugarG += day.totals.sugarG;
    summary.totalSodiumMg += day.totals.sodiumMg;
    summary.mealCount += day.totals.meals;
  }
  summary.avgKcal = daysWithMeals > 0 ? summary.totalKcal / daysWithMeals : 0;

  return { range, scope, date: anchorKey, targets, days, summary };
}
