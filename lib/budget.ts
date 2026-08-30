import type { Targets } from "./nutrition";

/**
 * BMR / TDEE / daily calorie budget (Mifflin-St Jeor).
 * Pure functions - shared by the API, the Settings UI and the AI context.
 */

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extra";
export type Goal = "maintain" | "lose" | "gain";
export type OverrideMode = "usual" | "more" | "less";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra: 1.9,
};

export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  maintain: 0,
  lose: -400,
  gain: 400,
};

export const OVERRIDE_ADJUSTMENT: Record<OverrideMode, number> = {
  usual: 0,
  more: 250,
  less: -250,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Active",
  extra: "Extra active",
};

export const GOAL_LABELS: Record<Goal, string> = {
  maintain: "Maintain",
  lose: "Lose",
  gain: "Gain",
};

/** Mifflin-St Jeor. null when any of the inputs is missing. */
export function computeBmr(
  weightKg: number | null,
  heightCm: number | null,
  age: number | null,
  gender: Gender | null
): number | null {
  if (!weightKg || !heightCm || !age || !gender) return null;
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export interface BudgetInput {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
  activity: ActivityLevel;
  goal: Goal;
  manualKcal: number | null;
  overrideMode: OverrideMode;
}

export interface Budget {
  kcal: number;
  /** false when a manual override is active */
  auto: boolean;
  bmr: number | null;
  tdee: number | null;
  /** false when age/gender are missing so BMR cannot be computed */
  complete: boolean;
}

/**
 * Today's calorie budget:
 * - manual override wins when set
 * - otherwise BMR x activity multiplier + goal adjustment + daily override
 * - falls back to 2000 kcal when the profile is incomplete (no age/gender)
 */
export function computeBudget(input: BudgetInput): Budget {
  if (input.manualKcal != null && input.manualKcal > 0) {
    return { kcal: input.manualKcal, auto: false, bmr: null, tdee: null, complete: true };
  }

  const bmr = computeBmr(input.weightKg, input.heightCm, input.age, input.gender);
  if (bmr === null) {
    return {
      kcal: 2000 + OVERRIDE_ADJUSTMENT[input.overrideMode],
      auto: true,
      bmr: null,
      tdee: null,
      complete: false,
    };
  }

  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activity];
  const kcal =
    tdee + GOAL_ADJUSTMENT[input.goal] + OVERRIDE_ADJUSTMENT[input.overrideMode];
  return { kcal: Math.round(kcal), auto: true, bmr: Math.round(bmr), tdee: Math.round(tdee), complete: true };
}

/** One-line profile summary for the AI prompt. */
export function profileContextText(input: {
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: Gender | null;
  activity: ActivityLevel;
  goal: Goal;
  budgetKcal: number | null;
  region?: string | null;
}): string {
  const parts: string[] = [];
  if (input.heightCm && input.weightKg) {
    const m = input.heightCm / 100;
    const bmi = input.weightKg / (m * m);
    parts.push(`${input.heightCm} cm, ${input.weightKg} kg, BMI ${bmi.toFixed(1)}`);
  }
  if (input.gender) parts.push(input.gender);
  if (input.age) parts.push(`${input.age} years`);
  parts.push(`activity: ${ACTIVITY_LABELS[input.activity].toLowerCase()}`);
  parts.push(`goal: ${GOAL_LABELS[input.goal].toLowerCase()}`);
  if (input.region) parts.push(`region: ${input.region}`);
  if (input.budgetKcal) parts.push(`daily calorie budget ~${input.budgetKcal} kcal`);
  return parts.join(", ");
}

/** Macro targets (protein/fat/carbs/sugar/sodium) with the budget as kcal. */
export function targetsWithBudget(
  targets: Targets,
  budgetKcal: number
): Targets {
  return { ...targets, kcal: budgetKcal };
}
