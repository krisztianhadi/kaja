import type { Suggestion } from "@/lib/db/schema";
import type { Targets, Totals } from "./nutrition";

/**
 * Deterministic counter-action rules based on the day's totals vs targets.
 * Cheap, instant, no AI. The AI later confirms or extends this suggestion.
 *
 * Two tones: while the day is still within a target, suggest what to eat to
 * balance it. Once a target is PAST, never suggest more food - the rule
 * shifts to stopping/lightening/hydrating. This is a post-meal log, not a
 * wishlist.
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
        "You are past your sugar target for today. Skip anything sweet for the rest of the day - water is the move now.",
    };
  }
  // sodium gets headroom: a normal salty meal can push 100-115% of the DV,
  // only meaningfully-over days should trigger the counter-action
  if (hasMeals && ratio(totals.sodiumMg, targets.sodiumMg) > 1.15) {
    return {
      level: "high",
      name: "sodium",
      message:
        "You are past your sodium target for today. Keep drinking water and go easy on salt for the rest of the day.",
    };
  }
  if (hasMeals && ratio(totals.fatG, targets.fatG) > 1.15) {
    return {
      level: "watch",
      name: "fat",
      message:
        "Fat is trending high today. Keep the rest of the day light - vegetables, lean protein, no fried food.",
    };
  }
  if (hasMeals && ratio(totals.kcal, targets.kcal) > 1.05) {
    return {
      level: "watch",
      name: "kcal",
      message:
        "You are over your calorie target for today. Go light for the rest of the day - or just stop eating, the log will still work.",
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
  // day still has room - balancing advice may suggest food
  if (hasMeals && ratio(totals.sugarG, targets.sugarG) > 0.75) {
    return {
      level: "watch",
      name: "sugar",
      message:
        "Sugar is getting high today. If you want something sweet, pair it with protein or fat (nuts, yogurt) to slow the rush.",
    };
  }
  if (hasMeals && ratio(totals.sodiumMg, targets.sodiumMg) > 0.8) {
    return {
      level: "watch",
      name: "sodium",
      message:
        "Sodium is climbing today. A banana, papaya, or coconut water helps your body handle it - and keep up the water.",
    };
  }
  return {
    level: "ok",
    name: "balanced",
    message: "Your day looks balanced so far.",
  };
}
