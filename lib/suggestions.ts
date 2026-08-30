import type { Suggestion } from "@/lib/db/schema";
import type { Targets, Totals } from "./nutrition";

/**
 * Deterministic counter-action rules based on the day's totals vs targets.
 * Cheap, instant, no AI. The AI later confirms or extends this suggestion.
 */
export function ruleSuggestion(
  totals: Totals,
  targets: Targets
): Omit<Suggestion, "aiConfirmed" | "aiExtra"> {
  const ratio = (value: number, target: number) => (target > 0 ? value / target : 0);
  const hasMeals = totals.meals > 0;

  if (hasMeals && ratio(totals.sugarG, targets.sugarG) > 1) {
    return {
      level: "high",
      name: "sugar",
      message:
        "Sugar is above your daily target. Balance the rest of the day with healthy fats - Greek yogurt, nuts, or avocado.",
    };
  }
  // sodium gets headroom: a normal salty meal can push 100-115% of the DV,
  // only meaningfully-over days should trigger the counter-action
  if (hasMeals && ratio(totals.sodiumMg, targets.sodiumMg) > 1.15) {
    return {
      level: "high",
      name: "sodium",
      message:
        "Sodium is above your daily target. Balance with potassium-rich foods (banana, potato, leafy greens) and plenty of water.",
    };
  }
  if (hasMeals && ratio(totals.fatG, targets.fatG) > 1.15) {
    return {
      level: "watch",
      name: "fat",
      message:
        "Fat is trending high today. Add fiber to the next meal - vegetables, whole grains, or legumes.",
    };
  }
  if (hasMeals && ratio(totals.kcal, targets.kcal) > 1.05) {
    return {
      level: "watch",
      name: "kcal",
      message:
        "You are over your calorie target. Keep the next meal light: lean protein and vegetables.",
    };
  }
  if (hasMeals && ratio(totals.proteinG, targets.proteinG) < 0.4) {
    return {
      level: "watch",
      name: "protein",
      message:
        "Protein is low so far today. Add eggs, chicken, fish, or beans to the next meal.",
    };
  }
  return {
    level: "ok",
    name: "balanced",
    message: "Your day looks balanced so far.",
  };
}
