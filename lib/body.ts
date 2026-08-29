import type { Targets } from "./nutrition";

/**
 * Rough body-metrics helpers (BMI + recommended daily intake).
 * Pure functions - shared by the Settings UI (client) and the AI context
 * builder (server). Estimates are deliberately simple: no age/sex input,
 * so BMR uses the core Mifflin-St Jeor terms with a light activity factor.
 */

export interface BodyInput {
  heightCm: number | null;
  weightKg: number | null;
  goals: string;
  diet: string;
}

export function computeBmi(
  heightCm: number | null,
  weightKg: number | null
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

const has = (text: string, ...words: string[]) =>
  words.some((w) => text.toLowerCase().includes(w));

/**
 * Recommended daily targets from height/weight + goals + diet.
 * Returns null when height and weight are not both set.
 */
export function recommendedTargets(input: BodyInput): Targets | null {
  const { heightCm, weightKg } = input;
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;

  const goals = input.goals.toLowerCase();
  const diet = input.diet.toLowerCase();

  // BMR via the Mifflin-St Jeor mass/height terms, light activity multiplier
  let kcal = (10 * weightKg + 6.25 * heightCm) * 1.2;

  if (has(goals, "lose weight", "weight loss", "fat loss", "cut")) {
    kcal *= 0.8; // -20%
  } else if (has(goals, "gain weight", "weight gain", "bulk", "muscle")) {
    kcal *= 1.15; // +15%
  }

  // protein: 1.6 g/kg moderate, 2 g/kg for protein/muscle goals
  let proteinG = has(goals, "high protein", "protein", "muscle", "gain weight")
    ? weightKg * 2
    : weightKg * 1.6;
  if (has(diet, "low protein")) proteinG = weightKg * 0.8;

  // fat: 25% of kcal
  const fatG = (kcal * 0.25) / 9;

  // carbs: remainder of kcal
  let carbsG = (kcal - proteinG * 4 - fatG * 9) / 4;
  if (has(diet, "keto")) carbsG = 40;
  else if (has(diet, "low carb")) carbsG = 120;

  let sugarG = 25;
  if (has(diet, "low sugar", "no sugar", "diabetes")) sugarG = 15;

  let sodiumMg = 2300;
  if (has(diet, "low sodium", "low salt", "no salt", "hypertension", "blood pressure")) {
    sodiumMg = 1500;
  }

  return {
    kcal: Math.round(kcal),
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
    sugarG,
    sodiumMg,
  };
}

/** One-line summary for the AI prompt. */
export function bodyContextText(input: BodyInput): string {
  const bmi = computeBmi(input.heightCm, input.weightKg);
  if (bmi === null) return "";
  return `Height ${input.heightCm} cm, weight ${input.weightKg} kg, BMI ${bmi.toFixed(
    1
  )} (${bmiCategory(bmi)})`;
}
