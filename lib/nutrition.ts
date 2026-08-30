import type { Meal, User } from "@/lib/db/schema";

export interface Targets {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number;
  sodiumMg: number;
}

export const DEFAULT_TARGETS: Targets = {
  kcal: 2000,
  proteinG: 50,
  fatG: 70,
  carbsG: 250,
  // total sugar (the AI estimates total, incl. natural sugars from fruit,
  // honey, milk) - the WHO 25g figure applies to FREE/ADDED sugar only,
  // so 40g is the sane yardstick for total sugar
  sugarG: 40,
  // FDA daily value
  sodiumMg: 2300,
};

/** Hot climates: heavy sweating raises sodium needs - modest allowance. */
export const HOT_CLIMATE_SODIUM_BUMP = 500;

export function targetsFromUser(
  user: Pick<
    User,
    | "manualKcal"
    | "targetProteinG"
    | "targetFatG"
    | "targetCarbsG"
    | "targetSugarG"
    | "targetSodiumMg"
    | "climate"
  >
): Targets {
  const sodiumBase = user.targetSodiumMg || DEFAULT_TARGETS.sodiumMg;
  return {
    // kcal placeholder: the effective value comes from the BMR/TDEE budget
    // via targetsWithBudget() - see lib/budget.ts
    kcal: user.manualKcal || DEFAULT_TARGETS.kcal,
    proteinG: user.targetProteinG || DEFAULT_TARGETS.proteinG,
    fatG: user.targetFatG || DEFAULT_TARGETS.fatG,
    carbsG: user.targetCarbsG || DEFAULT_TARGETS.carbsG,
    sugarG: user.targetSugarG || DEFAULT_TARGETS.sugarG,
    sodiumMg:
      sodiumBase + (user.climate === "hot" ? HOT_CLIMATE_SODIUM_BUMP : 0),
  };
}

export interface Totals {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number;
  sodiumMg: number;
  meals: number;
}

export function emptyTotals(): Totals {
  return {
    kcal: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    sugarG: 0,
    sodiumMg: 0,
    meals: 0,
  };
}

/**
 * How much of this meal counts for a given user:
 * - personal meal (no participants): full value for the author, 0 for others
 * - shared meal: 1/n for each participant, 0 for everyone else
 * Pass userId=null for family scope: every meal counts once, in full.
 */
export function mealScaleForUser(meal: Meal, userId: string | null): number {
  if (userId === null) return 1;
  const participants = meal.participantIds ?? [];
  if (participants.length <= 1) {
    return meal.authorId === userId ? 1 : 0;
  }
  if (!participants.includes(userId)) return 0;
  return 1 / participants.length;
}

export function addMeal(totals: Totals, meal: Meal, scale: number): Totals {
  if (scale <= 0) return totals;
  totals.kcal += meal.kcal * scale;
  totals.proteinG += meal.proteinG * scale;
  totals.fatG += meal.fatG * scale;
  totals.carbsG += meal.carbsG * scale;
  totals.sugarG += meal.sugarG * scale;
  totals.sodiumMg += meal.sodiumMg * scale;
  totals.meals += 1;
  return totals;
}

export function totalsForMeals(meals: Meal[], userId: string | null): Totals {
  const totals = emptyTotals();
  for (const meal of meals) {
    addMeal(totals, meal, mealScaleForUser(meal, userId));
  }
  return totals;
}

export function pct(value: number, target: number): number {
  return target > 0 ? (value / target) * 100 : 0;
}

export function totalsToText(totals: Totals, targets: Targets): string {
  const p = (v: number, t: number) => `${Math.round(v)}/${t} (${Math.round(pct(v, t))}%)`;
  return [
    `kcal ${p(totals.kcal, targets.kcal)}`,
    `protein ${p(totals.proteinG, targets.proteinG)}g`,
    `fat ${p(totals.fatG, targets.fatG)}g`,
    `carbs ${p(totals.carbsG, targets.carbsG)}g`,
    `sugar ${p(totals.sugarG, targets.sugarG)}g`,
    `sodium ${p(totals.sodiumMg, targets.sodiumMg)}mg`,
    `(${totals.meals} meal${totals.meals === 1 ? "" : "s"} so far)`,
  ].join(", ");
}
