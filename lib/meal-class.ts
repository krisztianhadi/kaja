import type { Nutrition } from "@/lib/db/schema";

/**
 * Meal severity classes for the light card tints:
 * - trashfood: very high sugar, or high sodium combined with high fat
 * - heavy: large calorie/fat load (but not trashfood)
 * - light: small, low-sugar, low-sodium meal
 * - balanced: everything else
 */
export type MealClass = "balanced" | "light" | "heavy" | "trashfood";

export function classifyMeal(n: Pick<
  Nutrition,
  "kcal" | "proteinG" | "fatG" | "carbsG" | "sugarG" | "sodiumMg"
>): MealClass {
  if (n.sugarG >= 18 || (n.sodiumMg >= 900 && n.fatG >= 22)) {
    return "trashfood";
  }
  if (n.kcal >= 600 || n.fatG >= 30) {
    return "heavy";
  }
  if (n.kcal <= 350 && n.sugarG <= 12 && n.sodiumMg <= 600) {
    return "light";
  }
  return "balanced";
}

/** Light tint classes per class (bg + border, dark variants included). */
export const MEAL_CLASS_TINTS: Record<MealClass, string> = {
  balanced:
    "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  light:
    "border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20",
  heavy:
    "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
  trashfood:
    "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20",
};
