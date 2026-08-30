import type { Nutrition } from "@/lib/db/schema";

/**
 * Meal severity classes for the light card tints.
 * Context-aware: what the food IS matters as much as the numbers.
 * - Thai kitchen dishes (som tum, pad ka pao, ...) are never trashfood
 * - Known junk food by name (mcdonalds, chips, cola, chocolate cake, ...)
 * - Health foods (protein shakes, smoothies, salads, ...) skip the
 *   keyword check - only the numbers decide
 * - Numeric fallback: a junk-food signature is high sugar AND high sodium
 */
export type MealClass = "balanced" | "light" | "heavy" | "trashfood";

/** Traditional kitchen dishes that should never read as trashfood. */
const KITCHEN_PHRASES = [
  "som tum",
  "somtum",
  "papaya salad",
  "pad ka pao",
  "pad kaprao",
  "pad thai",
  "thai",
  "green curry",
  "red curry",
  "massaman",
  "tom yum",
  "tom kha",
  "larb",
  "laab",
  "stir-fried basil",
];

/** Foods that read as health/whole foods - skip the keyword junk check. */
const HEALTH_WORDS = ["protein shake", "smoothie", "salad", "yogurt", "oats", "oatmeal", "fruit", "veggie", "vegetable", "soup", "curry"];

/** Known junk food, matched as phrases (safe substrings). */
const TRASH_PHRASES = [
  "big mac",
  "mcdonald",
  "kfc",
  "fried chicken",
  "hot dog",
  "milkshake",
  "fizzy",
  "lollipop",
  "gummy",
  "brownie",
  "doughnut",
];

/** Known junk food, matched as whole words only ("cake" in "pancakes" no). */
const TRASH_WORDS = [
  "burger",
  "hamburger",
  "cheeseburger",
  "fries",
  "chips",
  "crisps",
  "cola",
  "coca",
  "pepsi",
  "soda",
  "chocolate",
  "candy",
  "cake",
  "donut",
  "nugget",
];

function hasPhrase(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

function hasWord(text: string, words: string[]): boolean {
  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.some((t) => words.includes(t));
}

export function classifyMeal(
  text: string,
  n: Pick<
    Nutrition,
    "kcal" | "proteinG" | "fatG" | "carbsG" | "sugarG" | "sodiumMg"
  >
): MealClass {
  const t = text.toLowerCase();

  // context wins: traditional thai kitchen is never trashfood
  if (hasPhrase(t, KITCHEN_PHRASES)) {
    return n.kcal >= 600 || n.fatG >= 30 ? "heavy" : "balanced";
  }

  // health/whole foods skip the keyword junk check - numbers decide
  if (!hasPhrase(t, HEALTH_WORDS)) {
    if (hasPhrase(t, TRASH_PHRASES) || hasWord(t, TRASH_WORDS)) {
      return "trashfood";
    }
  }

  // numeric fallback: the junk signature is high sugar combined with
  // high sodium (soda, candy + salty snacks). A single high value alone
  // (e.g. a sweet fruit) does not make a meal trashfood.
  if (n.sugarG >= 25 && n.sodiumMg >= 900) {
    return "trashfood";
  }
  if (n.kcal >= 700 || n.fatG >= 35) {
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
